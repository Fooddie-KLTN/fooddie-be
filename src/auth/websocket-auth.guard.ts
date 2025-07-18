import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class WebSocketAuthGuard implements CanActivate {

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext();
    
    // For WebSocket subscriptions
    if (!ctx.connection) {
      throw new UnauthorizedException('WebSocket connection required');
    }

    const connectionContext = ctx.connection.context;
    const authHeader = connectionContext.headers?.authorization || connectionContext.Authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    // Expected header format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      // Use EXACTLY the same verification as AuthGuard
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach the payload to the connection context (same as AuthGuard does to request)
      connectionContext.user = payload;
      connectionContext.user.id = payload.sub;
      connectionContext.user.uid = payload.sub;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}