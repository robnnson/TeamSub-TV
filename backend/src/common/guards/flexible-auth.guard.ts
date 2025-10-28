import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { DisplayApiKeyGuard } from '../../sse/guards/display-api-key.guard';
import { lastValueFrom, Observable } from 'rxjs';

/**
 * Guard that allows either JWT authentication OR Display API key authentication
 * Useful for endpoints that need to be accessed by both admin users and display clients
 */
@Injectable()
export class FlexibleAuthGuard implements CanActivate {
  constructor(
    private jwtAuthGuard: JwtAuthGuard,
    private displayApiKeyGuard: DisplayApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if API key is present
    const hasApiKey =
      request.query?.apiKey ||
      request.headers['x-api-key'] ||
      (request.headers['authorization'] &&
        !request.headers['authorization'].startsWith('Bearer eyJ'));

    try {
      if (hasApiKey) {
        // Try API key authentication
        return await this.displayApiKeyGuard.canActivate(context);
      } else {
        // Try JWT authentication
        const result = this.jwtAuthGuard.canActivate(context);
        // Handle both Promise and Observable return types
        if (result instanceof Observable) {
          return await lastValueFrom(result);
        }
        return await result;
      }
    } catch (error) {
      // If one method fails, it's unauthorized
      throw new UnauthorizedException(
        'Authentication required (JWT or API key)',
      );
    }
  }
}
