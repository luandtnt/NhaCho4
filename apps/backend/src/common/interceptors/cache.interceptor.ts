import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 60000; // 60 seconds default

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.getCacheKey(request);

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return of(cached.data);
    }

    // Execute and cache
    return next.handle().pipe(
      tap((data) => {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }),
    );
  }

  private getCacheKey(request: any): string {
    return `${request.url}:${request.user?.sub || 'anonymous'}`;
  }

  clearCache() {
    this.cache.clear();
  }
}
