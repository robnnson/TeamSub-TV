import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Setting } from './entities/setting.entity';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
    private encryptionService: EncryptionService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(): Promise<Setting[]> {
    const settings = await this.settingsRepository.find();
    // Decrypt encrypted values before returning
    return settings.map(setting => this.decryptSetting(setting));
  }

  async findByKey(key: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return this.decryptSetting(setting);
  }

  async create(
    key: string,
    value: string,
    isEncrypted: boolean = false,
    description?: string,
  ): Promise<Setting> {
    let encryptedValue = value;
    let iv: string | null = null;

    if (isEncrypted) {
      const encrypted = this.encryptionService.encrypt(value);
      encryptedValue = encrypted.encrypted;
      iv = encrypted.iv;
    }

    const setting = this.settingsRepository.create({
      key,
      value: encryptedValue,
      isEncrypted,
      iv,
      description,
    });

    const saved = await this.settingsRepository.save(setting);
    return this.decryptSetting(saved);
  }

  async update(
    key: string,
    value: string,
    description?: string,
  ): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    let encryptedValue = value;
    let iv: string | null = setting.iv;

    if (setting.isEncrypted) {
      const encrypted = this.encryptionService.encrypt(value);
      encryptedValue = encrypted.encrypted;
      iv = encrypted.iv;
    }

    setting.value = encryptedValue;
    setting.iv = iv;
    if (description !== undefined) {
      setting.description = description;
    }

    const updated = await this.settingsRepository.save(setting);
    const decrypted = this.decryptSetting(updated);

    // Emit event for SSE
    this.eventEmitter.emit('settings.updated', {
      key: decrypted.key,
      value: decrypted.value,
      description: decrypted.description,
    });

    return decrypted;
  }

  async remove(key: string): Promise<void> {
    const result = await this.settingsRepository.delete({ key });
    if (result.affected === 0) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
  }

  async getValue(key: string): Promise<string> {
    const setting = await this.findByKey(key);
    return setting.value;
  }

  async setValue(key: string, value: string): Promise<void> {
    await this.update(key, value);
  }

  private decryptSetting(setting: Setting): Setting {
    if (setting.isEncrypted && setting.iv) {
      try {
        setting.value = this.encryptionService.decrypt(setting.value, setting.iv);
      } catch (error) {
        console.error(`Failed to decrypt setting "${setting.key}":`, error.message);
      }
    }
    return setting;
  }

  // Helper methods for common settings
  async getFpconStatus(): Promise<string> {
    try {
      return await this.getValue('fpcon_status');
    } catch {
      return 'NORMAL';
    }
  }

  async setFpconStatus(status: string): Promise<void> {
    const uppercaseStatus = status.toUpperCase();
    await this.setValue('fpcon_status', uppercaseStatus);

    // Emit specific FPCON event
    this.eventEmitter.emit('settings.fpcon.changed', {
      status: uppercaseStatus,
    });
  }

  async getLanStatus(): Promise<string> {
    try {
      return await this.getValue('lan_status');
    } catch {
      return 'NORMAL';
    }
  }

  async setLanStatus(status: string): Promise<void> {
    const uppercaseStatus = status.toUpperCase();
    await this.setValue('lan_status', uppercaseStatus);

    // Emit specific LAN event
    this.eventEmitter.emit('settings.lan.changed', {
      status: uppercaseStatus,
    });
  }

  async getApiKey(service: string): Promise<string> {
    return await this.getValue(`api_key_${service}`);
  }

  async setApiKey(service: string, apiKey: string): Promise<void> {
    const key = `api_key_${service}`;
    const exists = await this.settingsRepository.findOne({ where: { key } });

    if (exists) {
      await this.update(key, apiKey);
    } else {
      await this.create(key, apiKey, true, `API key for ${service}`);
    }
  }
}
