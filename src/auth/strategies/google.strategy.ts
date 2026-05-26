import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy }   from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService }      from '@nestjs/config';

export interface GoogleProfile {
  providerId: string;
  email:      string;
  firstName:  string;
  lastName:   string;
  avatar:     string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    const clientID     = config.get<string>('GOOGLE_CLIENT_ID')     || 'GOOGLE_NOT_CONFIGURED';
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') || 'GOOGLE_NOT_CONFIGURED';
    const callbackURL  = config.get<string>('GOOGLE_CALLBACK_URL')  || 'http://localhost:3000/api/v1/auth/google/callback';

    super({ clientID, clientSecret, callbackURL, scope: ['email', 'profile'] });

    if (clientID === 'GOOGLE_NOT_CONFIGURED') {
      this.logger.warn('Google OAuth non configuré — variables GOOGLE_CLIENT_ID/SECRET manquantes');
    }
  }

  async validate(_at: string, _rt: string, profile: Profile, done: VerifyCallback) {
    const { id, name, emails, photos } = profile;
    done(null, {
      providerId: id,
      email:      emails[0].value,
      firstName:  name.givenName,
      lastName:   name.familyName ?? '',
      avatar:     photos[0]?.value ?? '',
    });
  }
}
