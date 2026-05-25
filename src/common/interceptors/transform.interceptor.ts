// src/common/interceptors/transform.interceptor.ts
import {
  Injectable, NestInterceptor, ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map }        from 'rxjs/operators';

export interface ApiResponse<T> {
  status:    'success' | 'error';
  data:      T;
  meta?:     Record<string, any>;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(payload => {
        // Si le service renvoie { data, meta }, on les éclate
        if (payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload) {
          return {
            status:    'success',
            data:      payload.data,
            meta:      payload.meta,
            timestamp: new Date().toISOString(),
          };
        }
        return {
          status:    'success',
          data:      payload,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
