import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PERMISSIONS_KEY } from '../decorator/permissions.decorator';
import { UsersService } from 'src/modules/users/users.service';
import { PermissionType } from 'src/constants/permission.enum';

/**
 * Interface for JWT payload structure.
 */
interface JwtPayload {
  sub: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Interface for request object with authorization header and user data.
 */
interface RequestWithAuth {
  headers: {
    authorization?: string;
  };
  user?: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * Guard to protect routes based on user permissions.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Determines whether a request can proceed based on user permissions.
   *
   * @param context - The execution context from which the request is derived.
   * @returns A boolean indicating whether the user has the necessary permissions.
   * @throws UnauthorizedException if authentication fails.
   * @throws ForbiddenException if authorization fails.
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    try {
      const token = this.extractTokenFromRequest(request);
      const userId = await this.verifyTokenAndGetUserId(token);

      request.user = { id: userId };

      const userPermissions = await this.getUserPermissionStrings(userId);
      const hasPermission = this.checkRequiredPermissions(requiredPermissions, userPermissions);

      if (!hasPermission) {
        this.logger.warn(`User ${userId} attempted to access resource requiring ${requiredPermissions.join(', ')} but only has ${userPermissions.join(', ')}`);
        throw new ForbiddenException('Insufficient permissions to access this resource');
      }

      return true;
    } catch (error) {
      this.handleAuthenticationError(error);
      return false;
    }
  }

  /**
   * Extracts the token from the request authorization header.
   * 
   * @param request - The HTTP request object.
   * @returns The extracted JWT token.
   * @throws UnauthorizedException if token is missing or invalid.
   */
  private extractTokenFromRequest(request: RequestWithAuth): string {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [authType, token] = authHeader.split(' ');

    if (authType !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    return token;
  }

  /**
   * Verifies the JWT token and returns the user ID.
   * 
   * @param token - The JWT token to verify.
   * @returns The user ID from the verified token.
   * @throws UnauthorizedException if token verification fails.
   */
  private async verifyTokenAndGetUserId(token: string): Promise<string> {
    try {
      const decodedToken = this.jwtService.verify<JwtPayload>(token);

      if (!decodedToken.sub) {
        throw new Error('Token payload does not contain a user ID');
      }

      return decodedToken.sub;
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to verify token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets the user's permissions from the database as strings.
   * 
   * @param userId - The user's ID.
   * @returns Array of permission strings assigned to the user.
   * @throws UnauthorizedException if user not found.
   */
  private async getUserPermissionStrings(userId: string): Promise<string[]> {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.role) {
      this.logger.warn(`User ${userId} has no role assigned`);
      return [];
    }

    if (!user.role.permissions) {
      this.logger.warn(`Role ${user.role.name} has no permissions`);
      return [];
    }

    return user.role.permissions.map((permission) => permission.name);
  }

  /**
   * Checks if the user has the required permissions.
   * 
   * @param requiredPermissions - String permissions required for the endpoint.
   * @param userPermissions - String permissions the user has.
   * @returns True if user has all required permissions.
   */
  private checkRequiredPermissions(
    requiredPermissions: string[],
    userPermissions: string[]
  ): boolean {
    return requiredPermissions.every((required) => {
      // Direct match
      if (userPermissions.includes(required)) {
        return true;
      }

      // Check for "ALL" permission in the same category
      const permissionParts = required.split('_');
      if (permissionParts.length >= 2) {
        const resourceType = permissionParts[permissionParts.length - 1];
        const allPermission = `all_${resourceType}`;

        return userPermissions.includes(allPermission);
      }

      return false;
    });
  }

  /**
   * Handles authentication errors by throwing appropriate exceptions.
   * 
   * @param error - The error that occurred during authentication.
   * @throws UnauthorizedException with appropriate message.
   * @throws ForbiddenException if it's a permissions issue.
   */
  private handleAuthenticationError(error: unknown): never {
    if (error instanceof ForbiddenException) {
      throw error;
    }

    if (error instanceof Error) {
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }

    throw new UnauthorizedException('Invalid or expired token');
  }
}