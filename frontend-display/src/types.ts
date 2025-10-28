export type ContentType = 'image' | 'video' | 'slideshow' | 'text';

export interface Content {
  id: string;
  title: string;
  type: ContentType;
  filePath: string | null;
  textContent: string | null;
  metadata: Record<string, any>;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

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
}

export interface Schedule {
  id: string;
  displayId: string;
  contentId: string | null;
  contentIds: string[] | null;
  playlistId: string | null;
  playlist?: Playlist;
  startTime: string;
  endTime: string | null;
  recurrenceRule: string | null;
  priority: number;
  isActive: boolean;
  content?: Content;
}

export interface Display {
  id: string;
  name: string;
  location: string;
  lastSeen: string | null;
  status: 'online' | 'offline';
  createdAt: string;
  updatedAt: string;
}

export interface DisplayConfig {
  apiKey: string;
  displayId?: string;
  apiUrl?: string;
}
