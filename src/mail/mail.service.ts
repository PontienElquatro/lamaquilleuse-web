// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import * as nodemailer        from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger     = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from:        string;

  constructor(private config: ConfigService) {
    this.from = config.get<string>('MAIL_FROM');

    this.transporter = nodemailer.createTransport({
      host:   config.get<string>('MAIL_HOST'),
      port:   config.get<number>('MAIL_PORT'),
      secure: config.get<boolean>('MAIL_SECURE'),
      auth: {
        user: config.get<string>('MAIL_USER'),
        pass: config.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(to: string, firstName: string, token: string) {
    const url = `${this.config.get('FRONTEND_URL')}/verify-email?token=${token}`;

    await this.send(to, 'Confirmez votre adresse email', `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bonjour ${firstName} !</h2>
        <p>Merci de vous être inscrit sur <strong>LaMaquilleuse</strong>.</p>
        <p>Cliquez sur le bouton ci-dessous pour confirmer votre email :</p>
        <a href="${url}" style="
          display: inline-block;
          background: #e91e8c;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin: 16px 0;
        ">Confirmer mon email</a>
        <p style="color: #888; font-size: 13px;">Ce lien expire dans 24h. Si vous n'avez pas créé de compte, ignorez cet email.</p>
      </div>
    `);
  }

  async sendResetPasswordEmail(to: string, firstName: string, token: string) {
    const url = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`;

    await this.send(to, 'Réinitialisation de votre mot de passe', `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bonjour ${firstName} !</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <a href="${url}" style="
          display: inline-block;
          background: #e91e8c;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin: 16px 0;
        ">Réinitialiser mon mot de passe</a>
        <p style="color: #888; font-size: 13px;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      </div>
    `);
  }

  async sendWelcomeEmail(to: string, firstName: string) {
    await this.send(to, 'Bienvenue sur LaMaquilleuse !', `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenue ${firstName} !</h2>
        <p>Votre compte <strong>LaMaquilleuse</strong> est activé.</p>
        <p>Vous pouvez maintenant découvrir des maquilleuses professionnelles près de chez vous.</p>
        <a href="${this.config.get('FRONTEND_URL')}" style="
          display: inline-block;
          background: #e91e8c;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin: 16px 0;
        ">Découvrir la plateforme</a>
      </div>
    `);
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email envoyé à ${to} : ${subject}`);
    } catch (err) {
      this.logger.error(`Échec envoi email à ${to}`, err);
    }
  }
}
