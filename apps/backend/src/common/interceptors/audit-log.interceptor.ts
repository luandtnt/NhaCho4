import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/platform/audit/audit.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit mutations (C-006)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!isMutation) {
      return next.handle();
    }

    const user = request.user;
    const path = request.route?.path || request.url;
    const action = `${context.getClass().name}_${method}_${path}`;

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Async fire-and-forget audit log
          this.auditService
            .log({
              actor_id: user?.sub || 'anonymous',
              org_id: user?.org_id || null,
              action,
              resource_id: data?.id || null,
              request_id: request.headers['x-request-id'],
              metadata: {
                method,
                path,
                body: this.sanitizeBody(request.body),
              },
            })
            .catch((err) => {
              console.error('Failed to write audit log:', err);
            });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return {};
    // Remove sensitive fields (C-009)
    const { password, password_hash, secret, token, ...safe } = body;
    return safe;
  }
}
