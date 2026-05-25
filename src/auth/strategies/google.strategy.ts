// src/auth/strategies/google.strategy.ts
import { Injectable }       from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService }    from '@nestjs/config';

export interface GoogleProfile {
  providerId: string;
  email:      string;
  firstName:  string;
  lastName:   string;
  avatar:     string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID:     config.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL:  config.get<string>('GOOGLE_CALLBACK_URL'),
      scope:        ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { id, name, emails, photos } = profile;

    const googleProfile: GoogleProfile = {
      providerId: id,
      email:      emails[0].value,
      firstName:  name.givenName,
      lastName:   name.familyName,
      avatar:     photos[0]?.value,
    };

    done(null, googleProfile);
  }
}
