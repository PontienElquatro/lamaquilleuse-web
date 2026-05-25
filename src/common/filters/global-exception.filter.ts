// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx    = host.switchToHttp();
    const res    = ctx.getResponse<Response>();
    const req    = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let errors  = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exRes = exception.getResponse();

      if (typeof exRes === 'string') {
        message = exRes;
      } else if (typeof exRes === 'object') {
        const r = exRes as any;
        message = r.message || message;
        // class-validator renvoie un tableau de messages
        if (Array.isArray(r.message)) {
          errors  = r.message.map((m: string) => ({ message: m }));
          message = 'Données invalides';
        }
      }
    }

    // Log uniquement les 5xx
    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json({
      status:    'error',
      data:      null,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path:      req.url,
    });
  }
}
