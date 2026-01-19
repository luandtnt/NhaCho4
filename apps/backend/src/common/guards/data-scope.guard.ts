import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class DataScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip for public endpoints
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic || !user) {
      return true;
    }

    // Enforce org_id isolation (C-003)
    // This guard ensures that all queries will filter by org_id
    // Actual filtering happens in service layer
    if (!user.org_id) {
      throw new ForbiddenException({
        error_code: 'FORBIDDEN_SCOPE',
        message: 'User must belong to an organization',
        request_id: request.headers['x-request-id'],
      });
    }

    // Attach org_id to request for service layer
    request.org_id = user.org_id;
    request.assigned_asset_ids = user.assigned_asset_ids || [];

    return true;
  }
}
