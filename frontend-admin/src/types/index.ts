// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  mustChangePassword?: boolean;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'standard';
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Content types
export type ContentType = 'image' | 'video' | 'slideshow' | 'text';

export interface Content {
  id: string;
  title: string;
  type: ContentType;
  filePath: string | null;
  textContent: string | null;
  metadata: Record<string, any>;
  tags: string[];
  thumbnailPath: string | null;
  duration: number;
  expiresAt: string | null;
  isArchived: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
}

// Display types
export type DisplayStatus = 'online' | 'offline';
export type LayoutType = 'standard' | 'weather';

export interface Display {
  id: string;
  name: string;
  location: string;
  apiKeyEncrypted: string;
  apiKeyIv: string;
  lastSeen: string | null;
  status: DisplayStatus;
  layoutType?: LayoutType | null;
  createdAt: string;
  updatedAt: string;
  apiKey?: string; // Only present on creation
  groups?: DisplayGroup[];
  // Health monitoring fields
  lastHeartbeat?: string | null;
  uptimePercentage?: number | null;
  totalHeartbeats?: number;
  missedHeartbeats?: number;
  lastOnlineAt?: string | null;
  lastOfflineAt?: string | null;
  performanceMetrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkLatency?: number;
    lastUpdated?: string;
  } | null;
  errorLogs?: Array<{
    timestamp: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }> | null;
}

// Display Group types
export interface DisplayGroup {
  id: string;
  name: string;
  description: string | null;
  layoutType?: LayoutType | null;
  displays: Display[];
  createdAt: string;
  updatedAt: string;
}

// Schedule types
export interface Schedule {
  id: string;
  displayId: string | null;
  displayGroupId: string | null;
  contentId: string | null;
  contentIds: string[] | null;
  playlistId: string | null;
  startTime: string;
  endTime: string | null;
  recurrenceRule: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  display?: Display;
  displayGroup?: DisplayGroup;
  content?: Content;
  playlist?: Playlist;
}

// Settings types
export interface Setting {
  id: string;
  key: string;
  value: string;
  isEncrypted: boolean;
  iv: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// Stats types
export interface ContentStats {
  total: number;
  byType: Record<ContentType, number>;
}

export interface DisplayStats {
  total: number;
  online: number;
  offline: number;
}

export interface ScheduleStats {
  total: number;
  active: number;
  inactive: number;
}

// Playlist types
export interface PlaylistItem {
  id: string;
  contentId: string;
  content: Content;
  order: number;
  durationOverride: number | null;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  loop: boolean;
  items: PlaylistItem[];
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiError {
  message: string;
  error?: string;
  statusCode: number;
}


// Release Notes types
export interface ReleaseNote {
  id: string;
  version: string;
  title: string;
  content: string;
  releaseDate: string;
  isMajor: boolean;
  createdAt: string;
  updatedAt: string;
}

// Display Health Monitoring types
export interface DisplayHealth {
  displayId: string;
  displayName: string;
  status: DisplayStatus;
  uptime: number;
  totalHeartbeats: number;
  missedHeartbeats: number;
  lastHeartbeat: string | null;
  timeSinceLastHeartbeat: number | null;
  lastOnlineAt: string | null;
  lastOfflineAt: string | null;
  performanceMetrics: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkLatency?: number;
    lastUpdated?: string;
  } | null;
  errorLogs: Array<{
    timestamp: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  healthScore: number;
}

export interface DisplayAlert {
  displayId: string;
  displayName: string;
  type: 'offline' | 'low_uptime' | 'error' | 'high_cpu' | 'high_memory' | 'high_disk';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
}
