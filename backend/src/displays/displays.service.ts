import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Display, DisplayStatus } from './entities/display.entity';
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

  async createWithPairingCode(pairingCode: string, name: string, location?: string): Promise<Display> {
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
  ): Promise<Display> {
    const display = await this.findById(id);

    if (name !== undefined) display.name = name;
    if (location !== undefined) display.location = location;

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

  async heartbeat(displayId: string): Promise<void> {
    await this.updateLastSeen(displayId);
    await this.updateStatus(displayId, DisplayStatus.ONLINE);

    // Check for stale displays (no heartbeat in 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await this.displaysRepository
      .createQueryBuilder()
      .update(Display)
      .set({ status: DisplayStatus.OFFLINE })
      .where('lastSeen < :fiveMinutesAgo', { fiveMinutesAgo })
      .andWhere('status = :online', { online: DisplayStatus.ONLINE })
      .execute();
  }
}
