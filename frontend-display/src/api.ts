import axios, { AxiosInstance } from 'axios';
import type { Content, Schedule, Display } from './types';

class DisplayApiClient {
  private client: AxiosInstance;

  constructor(apiKeyParam: string, baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      headers: {
        'X-API-Key': apiKeyParam,
      },
    });
  }

  setApiKey(newApiKey: string) {
    this.client.defaults.headers['X-API-Key'] = newApiKey;
  }

  // Get current display info (using API key)
  async getMyDisplayInfo(): Promise<Display> {
    const { data } = await this.client.get<Display>('/displays/me');
    return data;
  }

  // Get display info by ID
  async getDisplayInfo(displayId: string): Promise<Display> {
    const { data } = await this.client.get<Display>(`/displays/${displayId}`);
    return data;
  }

  // Get schedules for this display
  async getSchedules(displayId: string): Promise<Schedule[]> {
    const { data } = await this.client.get<Schedule[]>('/schedules', {
      params: { displayId },
    });
    return data;
  }

  // Get content by ID
  async getContent(contentId: string): Promise<Content> {
    const { data } = await this.client.get<Content>(`/content/${contentId}`);
    return data;
  }

  // Get content URL
  getContentUrl(filePath: string): string {
    return `/api${filePath}`;
  }

  // Update display heartbeat
  async updateHeartbeat(displayId: string): Promise<void> {
    await this.client.post(`/displays/${displayId}/heartbeat`);
  }

  // Get current settings
  async getFpconStatus(): Promise<{ status: string }> {
    const { data } = await this.client.get<{ status: string }>('/settings/status/fpcon');
    return data;
  }

  async getLanStatus(): Promise<{ status: string }> {
    const { data } = await this.client.get<{ status: string }>('/settings/status/lan');
    return data;
  }
}

export default DisplayApiClient;
