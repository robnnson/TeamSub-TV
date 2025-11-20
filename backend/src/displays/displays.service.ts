import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Display, DisplayStatus } from './entities/display.entity';
import { LayoutType } from './types/layout-type.enum';
import { EncryptionService } from '../common/services/encryption.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DisplaysService {
  constructor(
    @InjectRepository(Display)
    private displaysRepository: Repository<Display>,
    private encryptionService: EncryptionService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Generate a 6-digit pairing code
  private generatePairingCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createWithPairingCode(pairingCode: string, name: string, location?: string, layoutType?: LayoutType): Promise<Display> {
    // Find unpaired display with this pairing code
    const unpairedDisplay = await this.displaysRepository.findOne({
      where: { pairingCode, apiKeyEncrypted: '' }
    });

    if (!unpairedDisplay) {
      throw new NotFoundException('Invalid or expired pairing code');
    }

    // Check if pairing code is expired
    if (unpairedDisplay.pairingCodeExpiry && unpairedDisplay.pairingCodeExpiry < new Date()) {
      throw new NotFoundException('Pairing code has expired');
    }

    // Generate API key and update display
    const apiKey = this.encryptionService.generateApiKey();
    const encrypted = this.encryptionService.encrypt(apiKey);

    unpairedDisplay.name = name;
    unpairedDisplay.location = location;
    if (layoutType !== undefined) unpairedDisplay.layoutType = layoutType;
    unpairedDisplay.apiKeyEncrypted = encrypted.encrypted;
    unpairedDisplay.apiKeyIv = encrypted.iv;
    unpairedDisplay.pairingCode = null;
    unpairedDisplay.pairingCodeExpiry = null;

    const saved = await this.displaysRepository.save(unpairedDisplay);

    // Emit event
    this.eventEmitter.emit('display.paired', saved);

    // Return display with plain API key (only shown once!)
    return {
      ...saved,
      apiKey, // Temporary field for initial setup
    } as any;
  }

  async create(name: string, location?: string): Promise<Display> {
    // Generate unique API key for this display
    const apiKey = this.encryptionService.generateApiKey();
    const encrypted = this.encryptionService.encrypt(apiKey);

    const display = this.displaysRepository.create({
      name,
      location,
      apiKeyEncrypted: encrypted.encrypted,
      apiKeyIv: encrypted.iv,
      status: DisplayStatus.OFFLINE,
    });

    const saved = await this.displaysRepository.save(display);

    // Emit event
    this.eventEmitter.emit('display.created', saved);

    // Return display with plain API key (only shown once!)
    return {
      ...saved,
      apiKey, // Temporary field for initial setup
    } as any;
  }

  // Create an unpaired display with a pairing code
  async generatePairingCodeForDisplay(): Promise<{ pairingCode: string; expiresAt: Date; displayId: string }> {
    const pairingCode = this.generatePairingCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const display = this.displaysRepository.create({
      name: 'Unpaired Display',
      apiKeyEncrypted: '', // Will be set when paired
      apiKeyIv: '',
      pairingCode,
      pairingCodeExpiry: expiresAt,
      status: DisplayStatus.OFFLINE,
    });

    const saved = await this.displaysRepository.save(display);

    return { pairingCode, expiresAt, displayId: saved.id };
  }

  // Check if display has been paired and return API key
  async checkPairingStatus(displayId: string): Promise<{ paired: boolean; apiKey?: string }> {
    const display = await this.displaysRepository.findOne({ where: { id: displayId } });

    if (!display) {
      throw new NotFoundException('Display not found');
    }

    // Check if display has been paired (has API key)
    if (display.apiKeyEncrypted && display.apiKeyIv) {
      const apiKey = this.encryptionService.decrypt(
        display.apiKeyEncrypted,
        display.apiKeyIv,
      );
      return { paired: true, apiKey };
    }

    return { paired: false };
  }

  async findAll(): Promise<Display[]> {
    return this.displaysRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Display> {
    const display = await this.displaysRepository.findOne({ where: { id } });
    if (!display) {
      throw new NotFoundException(`Display with ID ${id} not found`);
    }
    return display;
  }

  async findByApiKey(apiKey: string): Promise<Display | null> {
    const displays = await this.displaysRepository.find();

    for (const display of displays) {
      try {
        const decrypted = this.encryptionService.decrypt(
          display.apiKeyEncrypted,
          display.apiKeyIv,
        );
        if (decrypted === apiKey) {
          return display;
        }
      } catch (error) {
        console.error(`Failed to decrypt API key for display ${display.id}`);
      }
    }

    return null;
  }

  async update(
    id: string,
    name?: string,
    location?: string,
    layoutType?: LayoutType,
  ): Promise<Display> {
    const display = await this.findById(id);

    if (name !== undefined) display.name = name;
    if (location !== undefined) display.location = location;
    if (layoutType !== undefined) display.layoutType = layoutType;

    const updated = await this.displaysRepository.save(display);

    // Emit event
    this.eventEmitter.emit('display.updated', updated);

    return updated;
  }

  async updateStatus(id: string, status: DisplayStatus): Promise<void> {
    await this.displaysRepository.update(id, { status });
  }

  async updateLastSeen(id: string): Promise<void> {
    await this.displaysRepository.update(id, { lastSeen: new Date() });
  }

  async regenerateApiKey(id: string): Promise<{ apiKey: string }> {
    const display = await this.findById(id);

    // Generate new API key
    const apiKey = this.encryptionService.generateApiKey();
    const encrypted = this.encryptionService.encrypt(apiKey);

    display.apiKeyEncrypted = encrypted.encrypted;
    display.apiKeyIv = encrypted.iv;

    await this.displaysRepository.save(display);

    // Emit event
    this.eventEmitter.emit('display.apiKeyRegenerated', { id, displayName: display.name });

    return { apiKey };
  }

  async remove(id: string): Promise<void> {
    const display = await this.findById(id);
    await this.displaysRepository.remove(display);

    // Emit event
    this.eventEmitter.emit('display.deleted', { id });
  }

  async getStats(): Promise<{
    total: number;
    online: number;
    offline: number;
  }> {
    const displays = await this.displaysRepository.find();

    return {
      total: displays.length,
      online: displays.filter(d => d.status === DisplayStatus.ONLINE).length,
      offline: displays.filter(d => d.status === DisplayStatus.OFFLINE).length,
    };
  }

  async heartbeat(displayId: string, performanceMetrics?: any): Promise<void> {
    const display = await this.findById(displayId);
    const now = new Date();
    const wasOffline = display.status === DisplayStatus.OFFLINE;

    // Update basic heartbeat info
    await this.updateLastSeen(displayId);

    // Track heartbeat counts
    const totalHeartbeats = (display.totalHeartbeats || 0) + 1;

    // Update status and tracking
    const updateData: any = {
      status: DisplayStatus.ONLINE,
      lastHeartbeat: now,
      totalHeartbeats,
    };

    // If was offline, track the transition
    if (wasOffline) {
      updateData.lastOnlineAt = now;
      // Emit event for alert system
      this.eventEmitter.emit('display.online', {
        displayId: display.id,
        displayName: display.name,
        timestamp: now.toISOString(),
      });
    }

    // Update performance metrics if provided
    if (performanceMetrics) {
      updateData.performanceMetrics = {
        ...performanceMetrics,
        lastUpdated: now.toISOString(),
      };
    }

    // Calculate uptime percentage
    if (display.createdAt) {
      const totalTime = now.getTime() - display.createdAt.getTime();
      const offlineTime = (display.missedHeartbeats || 0) * 60 * 1000; // Assume 1-minute intervals
      const uptimePercentage = Math.max(0, Math.min(100, ((totalTime - offlineTime) / totalTime) * 100));
      updateData.uptimePercentage = Number(uptimePercentage.toFixed(2));
    }

    await this.displaysRepository.update(displayId, updateData);

    // Check for stale displays (no heartbeat in 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const staleDisplays = await this.displaysRepository
      .createQueryBuilder()
      .update(Display)
      .set({
        status: DisplayStatus.OFFLINE,
        lastOfflineAt: now,
      })
      .where('lastSeen < :fiveMinutesAgo', { fiveMinutesAgo })
      .andWhere('status = :online', { online: DisplayStatus.ONLINE })
      .returning('*')
      .execute();

    // Emit offline events for displays that just went offline
    if (staleDisplays.raw && staleDisplays.raw.length > 0) {
      for (const display of staleDisplays.raw) {
        this.eventEmitter.emit('display.offline', {
          displayId: display.id,
          displayName: display.name,
          timestamp: now.toISOString(),
        });

        // Increment missed heartbeats
        await this.displaysRepository.increment(
          { id: display.id },
          'missedHeartbeats',
          1,
        );
      }
    }

    // Clean up expired unpaired displays (run cleanup periodically)
    await this.cleanupExpiredUnpairedDisplays();
  }

  // Clean up expired unpaired displays
  async cleanupExpiredUnpairedDisplays(): Promise<number> {
    const result = await this.displaysRepository
      .createQueryBuilder()
      .delete()
      .from(Display)
      .where('apiKeyEncrypted = :empty', { empty: '' })
      .andWhere('pairingCodeExpiry < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  // Toggle debug overlay on display
  async toggleDebugOverlay(displayId: string, enabled: boolean): Promise<void> {
    const display = await this.findById(displayId);

    // Emit event to trigger debug overlay via SSE
    this.eventEmitter.emit('display.debug', {
      displayId: display.id,
      enabled,
      timestamp: new Date().toISOString(),
    });
  }

  async requestScreenshot(displayId: string): Promise<{ message: string }> {
    const display = await this.findById(displayId);

    // Emit event to trigger screenshot capture via SSE
    this.eventEmitter.emit('screenshot.request', {
      displayId: display.id,
      timestamp: new Date().toISOString(),
    });

    return { message: 'Screenshot request sent to display' };
  }

  async updateScreenshotPath(displayId: string, screenshotPath: string): Promise<void> {
    await this.displaysRepository.update(displayId, {
      lastScreenshotPath: screenshotPath,
      lastScreenshotAt: new Date(),
    });
  }

  // Health monitoring methods
  async getDisplayHealth(displayId: string): Promise<any> {
    const display = await this.findById(displayId);

    const now = new Date();
    const timeSinceLastHeartbeat = display.lastHeartbeat
      ? now.getTime() - display.lastHeartbeat.getTime()
      : null;

    return {
      displayId: display.id,
      displayName: display.name,
      status: display.status,
      uptime: display.uptimePercentage || 0,
      totalHeartbeats: display.totalHeartbeats || 0,
      missedHeartbeats: display.missedHeartbeats || 0,
      lastHeartbeat: display.lastHeartbeat,
      timeSinceLastHeartbeat,
      lastOnlineAt: display.lastOnlineAt,
      lastOfflineAt: display.lastOfflineAt,
      performanceMetrics: display.performanceMetrics,
      errorLogs: display.errorLogs || [],
      healthScore: this.calculateHealthScore(display),
    };
  }

  async getAllDisplaysHealth(): Promise<any[]> {
    const displays = await this.findAll();
    return Promise.all(
      displays.map(display => this.getDisplayHealth(display.id))
    );
  }

  async logDisplayError(
    displayId: string,
    message: string,
    severity: 'low' | 'medium' | 'high' = 'medium',
  ): Promise<void> {
    const display = await this.findById(displayId);
    const errorLogs = display.errorLogs || [];

    // Add new error log
    errorLogs.unshift({
      timestamp: new Date().toISOString(),
      message,
      severity,
    });

    // Keep only last 50 error logs
    const trimmedLogs = errorLogs.slice(0, 50);

    await this.displaysRepository.update(displayId, {
      errorLogs: trimmedLogs,
    });

    // Emit event for high severity errors
    if (severity === 'high') {
      this.eventEmitter.emit('display.error.high', {
        displayId: display.id,
        displayName: display.name,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async clearDisplayErrors(displayId: string): Promise<void> {
    await this.displaysRepository.update(displayId, {
      errorLogs: [],
    });
  }

  async getDisplayAlerts(): Promise<any[]> {
    const displays = await this.findAll();
    const alerts: any[] = [];

    for (const display of displays) {
      // Check if offline
      if (display.status === DisplayStatus.OFFLINE) {
        alerts.push({
          displayId: display.id,
          displayName: display.name,
          type: 'offline',
          severity: 'high',
          message: `Display "${display.name}" is offline`,
          timestamp: display.lastOfflineAt || new Date(),
        });
      }

      // Check for low uptime
      if (display.uptimePercentage !== null && display.uptimePercentage < 90) {
        alerts.push({
          displayId: display.id,
          displayName: display.name,
          type: 'low_uptime',
          severity: 'medium',
          message: `Display "${display.name}" has low uptime: ${display.uptimePercentage.toFixed(1)}%`,
          timestamp: new Date(),
        });
      }

      // Check for recent high-severity errors
      if (display.errorLogs && display.errorLogs.length > 0) {
        const recentHighErrors = display.errorLogs.filter(
          log => log.severity === 'high' &&
          new Date(log.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
        );

        if (recentHighErrors.length > 0) {
          alerts.push({
            displayId: display.id,
            displayName: display.name,
            type: 'error',
            severity: 'high',
            message: `Display "${display.name}" has ${recentHighErrors.length} recent high-severity errors`,
            timestamp: new Date(),
          });
        }
      }

      // Check performance metrics
      if (display.performanceMetrics) {
        const { cpuUsage, memoryUsage, diskUsage } = display.performanceMetrics;

        if (cpuUsage && cpuUsage > 90) {
          alerts.push({
            displayId: display.id,
            displayName: display.name,
            type: 'high_cpu',
            severity: 'medium',
            message: `Display "${display.name}" has high CPU usage: ${cpuUsage.toFixed(1)}%`,
            timestamp: new Date(),
          });
        }

        if (memoryUsage && memoryUsage > 90) {
          alerts.push({
            displayId: display.id,
            displayName: display.name,
            type: 'high_memory',
            severity: 'medium',
            message: `Display "${display.name}" has high memory usage: ${memoryUsage.toFixed(1)}%`,
            timestamp: new Date(),
          });
        }

        if (diskUsage && diskUsage > 85) {
          alerts.push({
            displayId: display.id,
            displayName: display.name,
            type: 'high_disk',
            severity: 'low',
            message: `Display "${display.name}" has high disk usage: ${diskUsage.toFixed(1)}%`,
            timestamp: new Date(),
          });
        }
      }
    }

    return alerts;
  }

  private calculateHealthScore(display: Display): number {
    let score = 100;

    // Deduct for offline status
    if (display.status === DisplayStatus.OFFLINE) {
      score -= 50;
    }

    // Deduct for low uptime
    if (display.uptimePercentage !== null) {
      if (display.uptimePercentage < 95) {
        score -= (95 - display.uptimePercentage);
      }
    }

    // Deduct for recent errors
    if (display.errorLogs && display.errorLogs.length > 0) {
      const recentErrors = display.errorLogs.filter(
        log => new Date(log.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
      score -= recentErrors.length * 2;
    }

    // Deduct for performance issues
    if (display.performanceMetrics) {
      const { cpuUsage, memoryUsage } = display.performanceMetrics;
      if (cpuUsage && cpuUsage > 80) score -= 5;
      if (memoryUsage && memoryUsage > 80) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}
