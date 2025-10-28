import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Display } from '../../displays/entities/display.entity';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class DisplayApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(Display)
    private displayRepository: Repository<Display>,
    private encryptionService: EncryptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Get API key from query parameter or header
    const apiKey =
      (request.query as any)?.apiKey ||
      request.headers['x-api-key'] ||
      request.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Find display with matching API key
    const displays = await this.displayRepository.find();

    for (const display of displays) {
      try {
        const decryptedKey = this.encryptionService.decrypt(
          display.apiKeyEncrypted,
          display.apiKeyIv,
        );

        if (decryptedKey === apiKey) {
          // Attach display to request for later use
          (request as any).display = display;
          return true;
        }
      } catch (error) {
        // Decryption failed, continue to next display
        continue;
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
