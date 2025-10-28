import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { SseService } from './sse.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DisplayApiKeyGuard } from './guards/display-api-key.guard';
import { v4 as uuidv4 } from 'uuid';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  /**
   * SSE endpoint for admin/standard users
   * Requires JWT authentication
   */
  @Get('stream')
  @UseGuards(JwtAuthGuard)
  async streamEvents(@Req() request: any, @Res() reply: FastifyReply) {
    const clientId = uuidv4();

    // Add client to SSE service
    this.sseService.addClient(clientId, reply);

    // Returning reply directly bypasses default NestJS response handling
    return reply;
  }

  /**
   * SSE endpoint for displays
   * Requires display API key
   */
  @Get('display')
  @UseGuards(DisplayApiKeyGuard)
  async streamDisplayEvents(@Req() request: any, @Res() reply: FastifyReply) {
    const display = request.display;
    const clientId = `display-${display.id}-${uuidv4()}`;

    // Add display client to SSE service
    this.sseService.addClient(clientId, reply, display.id);

    // Returning reply directly bypasses default NestJS response handling
    return reply;
  }

  /**
   * Get SSE statistics
   * Requires JWT authentication
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.sseService.getStats();
  }
}
