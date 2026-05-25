// src/auth/auth.service.ts
import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { JwtService }    from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService }   from '../mail/mail.service';
import { RegisterDto }   from './dto/register.dto';
import { LoginDto }      from './dto/login.dto';
import { AuthProvider, Role } from '@prisma/client';
import { GoogleProfile } from './strategies/google.strategy';
import * as bcrypt  from 'bcryptjs';
import * as crypto  from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma:  PrismaService,
    private jwt:     JwtService,
    private config:  ConfigService,
    private mail:    MailService,
  ) {}

  // ─── Helpers tokens ──────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret:    this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret:    this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    // Stocker le hash du refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data:  { refreshToken: hashedRefresh },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, resetPasswordToken, emailVerifyToken, ...safe } = user;
    return safe;
  }

  // ─── REGISTER ────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Un compte existe déjà avec cet email');

    const hashed  = await bcrypt.hash(dto.password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email:            dto.email,
        password:         hashed,
        firstName:        dto.firstName,
        lastName:         dto.lastName,
        role:             dto.role,
        provider:         AuthProvider.LOCAL,
        emailVerifyToken: verifyToken,
        isEmailVerified:  false,
      },
    });

    // Envoi email de vérification (async, non bloquant)
    this.mail.sendVerificationEmail(user.email, user.firstName, verifyToken).catch(() => {});

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    if (user.provider !== AuthProvider.LOCAL || !user.password) {
      throw new UnauthorizedException(
        `Ce compte utilise la connexion via ${user.provider}. Utilisez ce fournisseur.`
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    this.logger.log(`Login: ${user.email} (${user.role})`);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── REFRESH TOKEN ───────────────────────────────────────────────────

  async refreshTokens(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return tokens;
  }

  // ─── LOGOUT ──────────────────────────────────────────────────────────

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data:  { refreshToken: null },
    });
    return { message: 'Déconnexion réussie' };
  }

  // ─── VERIFY EMAIL ────────────────────────────────────────────────────

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) throw new BadRequestException('Token de vérification invalide');
    if (user.isEmailVerified) return { message: 'Email déjà vérifié' };

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified:  true,
        emailVerifyToken: null,
      },
    });

    // Email de bienvenue
    this.mail.sendWelcomeEmail(user.email, user.firstName).catch(() => {});

    return { message: 'Email vérifié avec succès' };
  }

  // ─── FORGOT PASSWORD ─────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Réponse identique même si l'email n'existe pas (sécurité anti-enumeration)
    if (!user) {
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    }

    if (user.provider !== AuthProvider.LOCAL) {
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    }

    const resetToken  = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken:  resetToken,
        resetPasswordExpiry: tokenExpiry,
      },
    });

    this.mail.sendResetPasswordEmail(user.email, user.firstName, resetToken).catch(() => {});

    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
  }

  // ─── RESET PASSWORD ───────────────────────────────────────────────────

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken:  token,
        resetPasswordExpiry: { gt: new Date() },
        deletedAt:           null,
      },
    });

    if (!user) {
      throw new BadRequestException('Token invalide ou expiré. Refaites une demande.');
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password:            hashed,
        resetPasswordToken:  null,
        resetPasswordExpiry: null,
        refreshToken:        null, // invalide toutes les sessions
      },
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  // ─── GOOGLE OAUTH ────────────────────────────────────────────────────

  async handleGoogleLogin(profile: GoogleProfile, defaultRole: Role = Role.CLIENT) {
    let user = await this.prisma.user.findFirst({
      where: { email: profile.email, deletedAt: null },
    });

    if (!user) {
      // Première connexion Google → création du compte
      user = await this.prisma.user.create({
        data: {
          email:           profile.email,
          firstName:       profile.firstName,
          lastName:        profile.lastName,
          avatar:          profile.avatar,
          provider:        AuthProvider.GOOGLE,
          providerId:      profile.providerId,
          role:            defaultRole,
          isEmailVerified: true, // Google vérifie déjà l'email
        },
      });
      this.mail.sendWelcomeEmail(user.email, user.firstName).catch(() => {});
    } else if (user.provider !== AuthProvider.GOOGLE) {
      // Email déjà utilisé avec LOCAL → on lie le compte Google
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          providerId:      profile.providerId,
          isEmailVerified: true,
          avatar:          user.avatar ?? profile.avatar,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── SOFT DELETE ACCOUNT ──────────────────────────────────────────────

  async deleteAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt:    new Date(),
        refreshToken: null,
        email:        `deleted_${userId}@lamaquilleuse.fr`, // libère l'email
      },
    });
    return { message: 'Compte supprimé avec succès' };
  }
}
