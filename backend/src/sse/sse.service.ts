import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FastifyReply } from 'fastify';

interface SseClient {
  id: string;
  displayId?: string;
  reply: FastifyReply;
  lastHeartbeat: Date;
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private clients: Map<string, SseClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor() {
    // Send heartbeat every 30 seconds to keep connections alive
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
  }

  onModuleDestroy() {
    clearInterval(this.heartbeatInterval);
    this.clients.forEach(client => {
      this.closeConnection(client.id);
    });
  }

  /**
   * Add a new SSE client
   */
  addClient(clientId: string, reply: FastifyReply, displayId?: string): void {
    // Set up SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Store client
    this.clients.set(clientId, {
      id: clientId,
      displayId,
      reply,
      lastHeartbeat: new Date(),
    });

    this.logger.log(`SSE client connected: ${clientId}${displayId ? ` (Display: ${displayId})` : ''}`);
    this.logger.log(`Total SSE clients: ${this.clients.size}`);

    // Send initial connection message
    this.sendToClient(clientId, 'connected', {
      clientId,
      displayId,
      timestamp: new Date().toISOString(),
      message: 'SSE connection established',
    });

    // Handle client disconnect using Fastify's request
    reply.request.raw.on('close', () => {
      this.removeClient(clientId);
    });
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      this.logger.log(`SSE client disconnected: ${clientId}`);
      this.logger.log(`Total SSE clients: ${this.clients.size}`);
    }
  }

  /**
   * Close a connection
   */
  closeConnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.reply.hijack();
        client.reply.send('');
      } catch (error) {
        this.logger.error(`Error closing connection ${clientId}:`, error);
      }
      this.removeClient(clientId);
    }
  }

  /**
   * Send event to a specific client
   */
  sendToClient(clientId: string, event: string, data: any): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      const res = (client.reply as any).raw || (client.reply as any).res;
      if (res && res.write) {
        res.write(message);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Error sending to client ${clientId}:`, error);
      this.closeConnection(clientId);
      return false;
    }
  }

  /**
   * Send event to all clients
   */
  broadcast(event: string, data: any): void {
    this.logger.debug(`Broadcasting event: ${event}`);
    let sent = 0;
    let failed = 0;

    this.clients.forEach((client) => {
      if (this.sendToClient(client.id, event, data)) {
        sent++;
      } else {
        failed++;
      }
    });

    this.logger.debug(`Broadcast complete: ${sent} sent, ${failed} failed`);
  }

  /**
   * Send event to all clients connected for a specific display
   */
  broadcastToDisplay(displayId: string, event: string, data: any): void {
    this.logger.debug(`Broadcasting to display ${displayId}: ${event}`);
    let sent = 0;

    this.clients.forEach((client) => {
      if (client.displayId === displayId) {
        if (this.sendToClient(client.id, event, data)) {
          sent++;
        }
      }
    });

    this.logger.debug(`Display broadcast complete: ${sent} clients notified`);
  }

  /**
   * Send heartbeat to all clients
   */
  private sendHeartbeat(): void {
    const now = new Date();
    this.clients.forEach((client) => {
      this.sendToClient(client.id, 'heartbeat', {
        timestamp: now.toISOString(),
      });
    });
  }

  /**
   * Get client statistics
   */
  getStats() {
    const displayClients = Array.from(this.clients.values()).filter(c => c.displayId);
    const generalClients = Array.from(this.clients.values()).filter(c => !c.displayId);

    return {
      total: this.clients.size,
      displays: displayClients.length,
      general: generalClients.length,
      connections: Array.from(this.clients.values()).map(c => ({
        id: c.id,
        displayId: c.displayId,
        lastHeartbeat: c.lastHeartbeat,
      })),
    };
  }

  // ==================== Event Listeners ====================

  /**
   * Listen for content changes
   */
  @OnEvent('content.created')
  @OnEvent('content.updated')
  @OnEvent('content.deleted')
  handleContentChange(payload: any) {
    this.logger.log(`Content change detected: ${JSON.stringify(payload)}`);
    this.broadcast('content.changed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Listen for settings changes
   */
  @OnEvent('settings.updated')
  handleSettingsChange(payload: any) {
    this.logger.log(`Settings change detected: ${payload.key}`);
    this.broadcast('settings.changed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Listen for FPCON changes
   */
  @OnEvent('settings.fpcon.changed')
  handleFpconChange(payload: any) {
    this.logger.log(`FPCON changed to: ${payload.status}`);
    this.broadcast('fpcon.changed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Listen for LAN status changes
   */
  @OnEvent('settings.lan.changed')
  handleLanChange(payload: any) {
    this.logger.log(`LAN status changed to: ${payload.status}`);
    this.broadcast('lan.changed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Listen for schedule triggers
   */
  @OnEvent('schedule.triggered')
  handleScheduleTrigger(payload: any) {
    const { displayId, contentId, scheduleId } = payload;
    this.logger.log(`Schedule ${scheduleId} triggered for display ${displayId}`);

    this.broadcastToDisplay(displayId, 'schedule.triggered', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Listen for display-specific content changes
   * Note: Wildcard events are not directly supported in @OnEvent decorator
   * This will be triggered manually by emitting the full event name
   */
  @OnEvent('display.content.changed')
  handleDisplayContentChange(payload: any) {
    // Extract display ID from payload
    const displayId = payload.displayId;
    if (displayId) {
      this.logger.log(`Display ${displayId} content changed`);
      this.broadcastToDisplay(displayId, 'content.update', {
        ...payload,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Listen for display status changes
   */
  @OnEvent('display.status.changed')
  handleDisplayStatusChange(payload: any) {
    this.logger.log(`Display ${payload.displayId} status: ${payload.status}`);
    this.broadcast('display.status', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Listen for schedule changes (created, updated, deleted)
   */
  @OnEvent('schedule.created')
  @OnEvent('schedule.updated')
  @OnEvent('schedule.deleted')
  handleScheduleChange(payload: any) {
    this.logger.log(`Schedule change detected: ${JSON.stringify(payload)}`);
    this.broadcast('schedule.changed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Listen for debug overlay toggle
   */
  @OnEvent('display.debug')
  handleDebugToggle(payload: any) {
    const { displayId, enabled } = payload;
    this.logger.log(`Debug overlay ${enabled ? 'enabled' : 'disabled'} for display ${displayId}`);
    this.broadcastToDisplay(displayId, 'debug.toggle', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}
