import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role }      from '../../common/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Non authentifié');
    if (user.role === Role.ADMIN) return true;
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Accès refusé. Rôle requis : ${requiredRoles.join(' ou ')}`);
    }
    return true;
  }
}
