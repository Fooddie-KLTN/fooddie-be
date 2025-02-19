/* eslint-disable prettier/prettier */
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorator/permissions.decorator';
import admin from 'src/firebase-admin.config';
import { log } from 'console';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector,
    private readonly userService: UsersService,
  ) {}


/**
 * Determines whether a request can proceed based on user permissions.
 * 
 * This method checks the required permissions from metadata and compares them
 * against the user's permissions obtained from a verified Firebase token in the
 * request header. If no required permissions are specified, access is allowed.
 * If the request lacks a valid authorization token, or if the token is invalid
 * or expired, an UnauthorizedException is thrown.
 * 
 * @param context - The execution context from which the request is derived.
 * 
 * @returns A boolean indicating whether the user has the necessary permissions 
 *          to proceed with the request.
 * 
 * @throws UnauthorizedException if the authorization token is missing, invalid, 
 *         or expired.
 */

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lấy danh sách permission cần thiết từ metadata
    const requiredPermissions = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Không yêu cầu permission nào -> cho phép truy cập
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();


    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      log('decodedToken', decodedToken);

      // Get user from database
      const user = await this.userService.findOne(decodedToken.user_id as string);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const userPermissions: string[] = user.role?.permissions || [];
      log('userPermissions', userPermissions);
      return requiredPermissions.every(permission => userPermissions.includes(permission));
      
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
