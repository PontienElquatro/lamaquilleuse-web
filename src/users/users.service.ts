// src/users/users.service.ts
import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService }    from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchArtistsDto } from './dto/search-artists.dto';
import { ServiceStatus }    from '@prisma/client';

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService) {}

  // ─── Sélection publique d'un profil artiste ────────────────────────
  private readonly artistPublicSelect = {
    id:          true,
    firstName:   true,
    lastName:    true,
    avatar:      true,
    bio:         true,
    city:        true,
    specialties: true,
    yearsOfExp:  true,
    instagramUrl: true,
    websiteUrl:  true,
    isVerified:  true,
    createdAt:   true,
  };

  // ─── Mon profil ────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id:             true,
        email:          true,
        firstName:      true,
        lastName:       true,
        phone:          true,
        avatar:         true,
        bio:            true,
        role:           true,
        city:           true,
        specialties:    true,
        yearsOfExp:     true,
        instagramUrl:   true,
        websiteUrl:     true,
        isVerified:     true,
        isEmailVerified: true,
        provider:       true,
        createdAt:      true,
        _count: {
          select: {
            services:           true,
            bookingsAsArtist:   true,
            bookingsAsClient:   true,
            reviewsReceived:    true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  // ─── Modifier mon profil ────────────────────────────────────────────
  async updateMe(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data:  dto,
      select: {
        id: true, firstName: true, lastName: true,
        phone: true, bio: true, city: true,
        specialties: true, yearsOfExp: true,
        instagramUrl: true, websiteUrl: true,
        avatar: true,
      },
    });
  }

  // ─── Upload avatar ──────────────────────────────────────────────────
  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data:  { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });
  }

  // ─── Mes notifications ──────────────────────────────────────────────
  async getMyNotifications(userId: string, page = 1, limit = 20) {
    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data,
      meta: { page, limit, total, unread, hasMore: page * limit < total },
    };
  }

  // ─── Marquer notifications lues ─────────────────────────────────────
  async markNotificationsRead(userId: string, ids?: string[]) {
    const where = ids?.length
      ? { userId, id: { in: ids } }
      : { userId, isRead: false };

    await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
    return { message: 'Notifications marquées comme lues' };
  }

  // ─── Recherche artistes (marketplace) ─────────────────────────────
  async searchArtists(dto: SearchArtistsDto) {
    const { city, specialty, minRating, search, page = 1, limit = 20, sortBy = 'rating' } = dto;

    const where: any = {
      role:     'ARTIST',
      deletedAt: null,
      ...(city      && { city: { contains: city, mode: 'insensitive' } }),
      ...(specialty && { specialties: { has: specialty } }),
      ...(search    && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName:  { contains: search, mode: 'insensitive' } },
          { bio:       { contains: search, mode: 'insensitive' } },
          { city:      { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [artists, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          ...this.artistPublicSelect,
          _count: { select: { reviewsReceived: true, services: true } },
          reviewsReceived: {
            select: { rating: true },
          },
        },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Calcul note moyenne + filtre rating minimum
    let enriched = artists.map(artist => {
      const reviews = (artist as any).reviewsReceived as { rating: number }[];
      const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : null;

      const { reviewsReceived, ...rest } = artist as any;
      return { ...rest, avgRating: avgRating ? +avgRating.toFixed(1) : null };
    });

    if (minRating) {
      enriched = enriched.filter(a => a.avgRating && a.avgRating >= minRating);
    }

    // Tri
    if (sortBy === 'rating') {
      enriched.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    } else if (sortBy === 'popular') {
      enriched.sort((a, b) => (b._count.services ?? 0) - (a._count.services ?? 0));
    }

    return {
      data: enriched,
      meta: { page, limit, total, hasMore: page * limit < total },
    };
  }

  // ─── Profil public d'une artiste ────────────────────────────────────
  async getArtistProfile(artistId: string) {
    const artist = await this.prisma.user.findFirst({
      where: { id: artistId, role: 'ARTIST', deletedAt: null },
      select: {
        ...this.artistPublicSelect,
        services: {
          where:   { status: ServiceStatus.ACTIVE, deletedAt: null },
          select: {
            id: true, slug: true, title: true, category: true,
            duration: true, price: true, currency: true,
            isHomeService: true,
            images: { orderBy: { order: 'asc' }, take: 1 },
            _count: { select: { reviews: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        reviewsReceived: {
          where: { deletedAt: null },
          select: {
            id: true, rating: true, comment: true, reply: true,
            createdAt: true,
            client: { select: { firstName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviewsReceived: true, services: true } },
      },
    });

    if (!artist) throw new NotFoundException('Maquilleuse introuvable');

    // Calcul note moyenne
    const reviews = (artist as any).reviewsReceived as { rating: number }[];
    const avgRating = reviews.length
      ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    return { ...artist, avgRating };
  }

  // ─── Portfolio d'une artiste ─────────────────────────────────────────
  async getArtistPortfolio(artistId: string, page = 1, limit = 12) {
    const artist = await this.prisma.user.findFirst({
      where: { id: artistId, role: 'ARTIST', deletedAt: null },
      select: { id: true },
    });
    if (!artist) throw new NotFoundException('Maquilleuse introuvable');

    const images = await this.prisma.serviceImage.findMany({
      where: { service: { artistId, deletedAt: null } },
      select: { id: true, url: true, order: true, service: { select: { title: true, category: true } } },
      skip:  (page - 1) * limit,
      take:  limit,
      orderBy: { createdAt: 'desc' },
    });

    return { data: images, meta: { page, limit } };
  }

  // ─── Disponibilités d'une artiste (délégué à AgendaService) ────────
  async getArtistAvailability(artistId: string, date: string) {
    const artist = await this.prisma.user.findFirst({
      where: { id: artistId, role: 'ARTIST', deletedAt: null },
    });
    if (!artist) throw new NotFoundException('Maquilleuse introuvable');

    // TODO: déléguée à AgendaService quand il sera implémenté
    return { artistId, date, slots: [] };
  }

  // ─── Changer mot de passe ─────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const bcrypt = await import('bcryptjs');

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user?.password) {
      throw new BadRequestException('Ce compte utilise une connexion sociale');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new ForbiddenException('Mot de passe actuel incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, refreshToken: null },
    });

    return { message: 'Mot de passe modifié avec succès' };
  }
}
