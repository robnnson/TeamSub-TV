import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  LoginCredentials,
  AuthTokens,
  User,
  Content,
  Display,
  Schedule,
  Setting,
  ContentStats,
  DisplayStats,
  ScheduleStats,
  Playlist,
} from '../types';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load tokens from localStorage
    this.loadTokens();

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
          originalRequest._retry = true;

          try {
            const { accessToken } = await this.refreshAccessToken();
            this.accessToken = accessToken;
            this.saveTokens();

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokens() {
    if (this.accessToken) localStorage.setItem('accessToken', this.accessToken);
    if (this.refreshToken) localStorage.setItem('refreshToken', this.refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { data } = await this.client.post<AuthTokens>('/auth/login', credentials);
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.saveTokens();
    // Store mustChangePassword flag
    if (data.mustChangePassword !== undefined) {
      localStorage.setItem('mustChangePassword', String(data.mustChangePassword));
    }
    return data;
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    const { data } = await this.client.post<AuthTokens>('/auth/refresh', {
      refreshToken: this.refreshToken,
    });
    return data;
  }

  logout() {
    this.clearTokens();
    localStorage.removeItem('mustChangePassword');
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  mustChangePassword(): boolean {
    return localStorage.getItem('mustChangePassword') === 'true';
  }

  // Users endpoints
  async getUsers(): Promise<User[]> {
    const { data } = await this.client.get<User[]>('/users');
    return data;
  }

  async getUser(id: string): Promise<User> {
    const { data} = await this.client.get<User>(`/users/${id}`);
    return data;
  }

  async createUser(userData: { email: string; password: string; role: string }): Promise<User> {
    const { data } = await this.client.post<User>('/users', userData);
    return data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const { data } = await this.client.patch<User>(`/users/${id}`, userData);
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<User> {
    const { data } = await this.client.post<User>('/users/change-password', {
      currentPassword,
      newPassword,
    });
    // Clear mustChangePassword flag after successful password change
    localStorage.removeItem('mustChangePassword');
    return data;
  }

  // Content endpoints
  async getContent(): Promise<Content[]> {
    const { data } = await this.client.get<Content[]>('/content');
    return data;
  }

  async getContentById(id: string): Promise<Content> {
    const { data } = await this.client.get<Content>(`/content/${id}`);
    return data;
  }

  async createTextContent(contentData: { title: string; textContent: string; duration?: number }): Promise<Content> {
    const { data } = await this.client.post<Content>('/content/text', contentData);
    return data;
  }

  async uploadContent(file: File, title: string, duration: number): Promise<Content> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('duration', duration.toString());

    const { data } = await this.client.post<Content>('/content/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  }

  async updateContent(id: string, contentData: Partial<Content>): Promise<Content> {
    const { data } = await this.client.patch<Content>(`/content/${id}`, contentData);
    return data;
  }

  async deleteContent(id: string): Promise<void> {
    await this.client.delete(`/content/${id}`);
  }

  async getContentStats(): Promise<ContentStats> {
    const { data } = await this.client.get<ContentStats>('/content/stats');
    return data;
  }

  // Displays endpoints
  async getDisplays(): Promise<Display[]> {
    const { data } = await this.client.get<Display[]>('/displays');
    return data;
  }

  async getDisplay(id: string): Promise<Display> {
    const { data } = await this.client.get<Display>(`/displays/${id}`);
    return data;
  }

  async createDisplay(displayData: { name: string; location: string; pairingCode?: string }): Promise<Display> {
    const { data } = await this.client.post<Display>('/displays', displayData);
    return data;
  }

  async updateDisplay(id: string, displayData: Partial<Display>): Promise<Display> {
    const { data } = await this.client.patch<Display>(`/displays/${id}`, displayData);
    return data;
  }

  async regenerateDisplayKey(id: string): Promise<{ apiKey: string }> {
    const { data } = await this.client.post<{ apiKey: string }>(`/displays/${id}/regenerate-key`);
    return data;
  }

  async deleteDisplay(id: string): Promise<void> {
    await this.client.delete(`/displays/${id}`);
  }

  async getDisplayStats(): Promise<DisplayStats> {
    const { data } = await this.client.get<DisplayStats>('/displays/stats');
    return data;
  }

  // Schedules endpoints
  async getSchedules(displayId?: string): Promise<Schedule[]> {
    const params = displayId ? { displayId } : {};
    const { data } = await this.client.get<Schedule[]>('/schedules', { params });
    return data;
  }

  async getSchedule(id: string): Promise<Schedule> {
    const { data } = await this.client.get<Schedule>(`/schedules/${id}`);
    return data;
  }

  async createSchedule(scheduleData: {
    displayId: string;
    contentId?: string;
    contentIds?: string[];
    startTime: string;
    endTime?: string;
    recurrenceRule?: string;
    priority?: number;
    isActive?: boolean;
  }): Promise<Schedule> {
    const { data } = await this.client.post<Schedule>('/schedules', scheduleData);
    return data;
  }

  async updateSchedule(id: string, scheduleData: Partial<Schedule>): Promise<Schedule> {
    const { data } = await this.client.patch<Schedule>(`/schedules/${id}`, scheduleData);
    return data;
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.client.delete(`/schedules/${id}`);
  }

  async getScheduleStats(): Promise<ScheduleStats> {
    const { data } = await this.client.get<ScheduleStats>('/schedules/stats');
    return data;
  }

  // Settings endpoints
  async getSettings(): Promise<Setting[]> {
    const { data } = await this.client.get<Setting[]>('/settings');
    return data;
  }

  async getSetting(key: string): Promise<Setting> {
    const { data } = await this.client.get<Setting>(`/settings/${key}`);
    return data;
  }

  async updateSetting(key: string, value: string, description?: string): Promise<Setting> {
    const { data } = await this.client.patch<Setting>(`/settings/${key}`, { value, description });
    return data;
  }

  async getFpconStatus(): Promise<{ status: string }> {
    const { data } = await this.client.get<{ status: string }>('/settings/status/fpcon');
    return data;
  }

  async updateFpconStatus(status: string): Promise<{ status: string; message: string }> {
    const { data } = await this.client.patch<{ status: string; message: string }>(
      '/settings/status/fpcon',
      { status }
    );
    return data;
  }

  async getLanStatus(): Promise<{ status: string }> {
    const { data } = await this.client.get<{ status: string }>('/settings/status/lan');
    return data;
  }

  async updateLanStatus(status: string): Promise<{ status: string; message: string }> {
    const { data } = await this.client.patch<{ status: string; message: string }>(
      '/settings/status/lan',
      { status }
    );
    return data;
  }

  // Playlists endpoints
  async getPlaylists(): Promise<Playlist[]> {
    const { data } = await this.client.get<Playlist[]>('/playlists');
    return data;
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const { data } = await this.client.get<Playlist>(`/playlists/${id}`);
    return data;
  }

  async createPlaylist(playlistData: {
    name: string;
    description?: string;
    items: Array<{ contentId: string; durationOverride?: number }>;
  }): Promise<Playlist> {
    const { data } = await this.client.post<Playlist>('/playlists', playlistData);
    return data;
  }

  async updatePlaylist(
    id: string,
    playlistData: {
      name?: string;
      description?: string;
      items?: Array<{ contentId: string; durationOverride?: number }>;
    },
  ): Promise<Playlist> {
    const { data } = await this.client.patch<Playlist>(`/playlists/${id}`, playlistData);
    return data;
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.client.delete(`/playlists/${id}`);
  }
}

export const api = new ApiClient();
