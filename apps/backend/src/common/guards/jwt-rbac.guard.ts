import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtRbacGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    // First, run JWT authentication
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        error_code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        request_id: request.headers['x-request-id'],
      });
    }

    // Check permissions (if specified)
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check roles (if specified)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Debug logging
    console.log('[RBAC Debug]', {
      path: request.url,
      requiredPermissions,
      requiredRoles,
      userScopes: user.scopes,
      userRole: user.role,
    });

    // If neither permissions nor roles specified, deny by default (C-005)
    if ((!requiredPermissions || requiredPermissions.length === 0) && 
        (!requiredRoles || requiredRoles.length === 0)) {
      throw new ForbiddenException({
        error_code: 'FORBIDDEN_SCOPE',
        message: 'Access denied: no role or permission specified',
        request_id: request.headers['x-request-id'],
      });
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      // Admin has all permissions
      if (user.role === 'OrgAdmin' || user.role === 'PlatformAdmin') {
        return true;
      }

      // Check if user has wildcard scope
      if (user.scopes && user.scopes.includes('*')) {
        return true;
      }

      // Check if user has required permissions
      const userScopes = user.scopes || [];
      const hasPermission = requiredPermissions.some((perm) => {
        // Check exact match or wildcard match (e.g., "invoice:*" matches "invoice:create")
        return userScopes.some((scope: string) => {
          if (scope === perm) return true;
          if (scope.endsWith(':*')) {
            const prefix = scope.slice(0, -2);
            return perm.startsWith(prefix + ':');
          }
          return false;
        });
      });

      if (!hasPermission) {
        throw new ForbiddenException({
          error_code: 'FORBIDDEN_SCOPE',
          message: `Access denied: requires one of permissions [${requiredPermissions.join(', ')}]`,
          request_id: request.headers['x-request-id'],
        });
      }

      return true;
    }

    if (requiredRoles && requiredRoles.length > 0) {
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

    return true;
  }
}
