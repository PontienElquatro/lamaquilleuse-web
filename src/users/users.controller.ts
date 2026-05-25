// src/users/users.controller.ts
import {
  Controller, Get, Put, Post, Patch,
  Body, Param, Query, UseGuards,
  ParseUUIDPipe, UseInterceptors,
  UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor }   from '@nestjs/platform-express';
import { JwtAuthGuard }      from '../auth/guards/jwt-auth.guard';
import { RolesGuard }        from '../auth/guards/roles.guard';
import { Public }            from '../auth/decorators/public.decorator';
import { CurrentUser }       from '../common/decorators/current-user.decorator';
import { UsersService }      from './users.service';
import { UpdateProfileDto }  from './dto/update-profile.dto';
import { SearchArtistsDto }  from './dto/search-artists.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Routes publiques (marketplace) ─────────────────────────────────

  @Public()
  @Get('artists')
  searchArtists(@Query() dto: SearchArtistsDto) {
    return this.usersService.searchArtists(dto);
  }

  @Public()
  @Get('artists/:id')
  getArtistProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getArtistProfile(id);
  }

  @Public()
  @Get('artists/:id/portfolio')
  getArtistPortfolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 12,
  ) {
    return this.usersService.getArtistPortfolio(id, +page, +limit);
  }

  @Public()
  @Get('artists/:id/availability')
  getArtistAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date: string,
  ) {
    return this.usersService.getArtistAvailability(id, date);
  }

  // ─── Routes privées (profil courant) ────────────────────────────────

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Put('me')
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMe(userId, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      cb(null, allowed.includes(file.mimetype));
    },
  }))
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // TODO: upload vers S3/Supabase Storage
    const avatarUrl = `https://storage.lamaquilleuse.fr/avatars/${userId}/${Date.now()}`;
    return this.usersService.updateAvatar(userId, avatarUrl);
  }

  @Get('me/notifications')
  getNotifications(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getMyNotifications(userId, +page, +limit);
  }

  @Patch('me/notifications/read')
  @HttpCode(HttpStatus.OK)
  markNotificationsRead(
    @CurrentUser('id') userId: string,
    @Body('ids') ids?: string[],
  ) {
    return this.usersService.markNotificationsRead(userId, ids);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser('id') userId: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.changePassword(userId, currentPassword, newPassword);
  }
}
