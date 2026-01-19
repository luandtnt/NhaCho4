import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, deny by default (C-005)
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException({
        error_code: 'FORBIDDEN_SCOPE',
        message: 'Access denied: no role specified',
        request_id: context.switchToHttp().getRequest().headers['x-request-id'],
      });
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user not set, it means JWT guard hasn't run yet or auth failed
    // We should let it pass here and let JWT guard handle authentication
    // But we need to check after JWT guard runs
    if (!user) {
      // This will be caught by JWT guard if token is invalid
      return true;
    }

    // Now check if user has required role
    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException({
        error_code: 'FORBIDDEN_SCOPE',
        message: `Access denied: requires one of roles [${requiredRoles.join(', ')}]`,
        request_id: request.headers['x-request-id'],
      });
    }

    return true;
  }
}
