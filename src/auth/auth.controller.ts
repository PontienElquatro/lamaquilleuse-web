// src/auth/auth.controller.ts
import {
  Controller, Post, Get, Delete, Body, Req, Res,
  UseGuards, HttpCode, HttpStatus, Query, Param,
} from '@nestjs/common';
import { AuthGuard }          from '@nestjs/passport';
import { ConfigService }      from '@nestjs/config';
import { Response }           from 'express';
import { AuthService }        from './auth.service';
import { RegisterDto }        from './dto/register.dto';
import { LoginDto }           from './dto/login.dto';
import { ForgotPasswordDto }  from './dto/forgot-password.dto';
import { ResetPasswordDto }   from './dto/reset-password.dto';
import { JwtAuthGuard }       from './guards/jwt-auth.guard';
import { Public }             from './decorators/public.decorator';
import { CurrentUser }        from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService:   AuthService,
    private configService: ConfigService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─── Login ───────────────────────────────────────────────────────────
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─── Refresh Token ───────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@CurrentUser('id') userId: string) {
    return this.authService.refreshTokens(userId);
  }

  // ─── Logout ──────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  // ─── Verify Email ────────────────────────────────────────────────────
  @Public()
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // ─── Forgot Password ─────────────────────────────────────────────────
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // ─── Reset Password ──────────────────────────────────────────────────
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  // ─── Google OAuth — initiation ───────────────────────────────────────
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirige automatiquement vers Google
  }

  // ─── Google OAuth — callback ─────────────────────────────────────────
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result   = await this.authService.handleGoogleLogin(req.user);
    const frontend = this.configService.get<string>('FRONTEND_URL');

    // Redirige avec les tokens en query params (à stocker côté client)
    res.redirect(
      `${frontend}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`
    );
  }

  // ─── Get me (profil courant) ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return user;
  }

  // ─── Delete Account (soft) ───────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@CurrentUser('id') userId: string) {
    return this.authService.deleteAccount(userId);
  }
}
