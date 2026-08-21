export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoiceChannel {
  id: string;
  name: string;
  description?: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParticipantState {
  socketId: string;
  userId: string;
  username: string;
  avatar: string;
  role: UserRole;
  channelId: string;
  isMuted: boolean;
  isDeafened: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  joinedAt: string;
}

export interface MediaDeviceItem {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  avatar: string;
  role: UserRole;
  content: string;
  createdAt: string;
}

export interface MusicTrack {
  youtubeId: string;
  title: string;
  thumbnail: string;
  duration: number;
  addedBy: string;
}

export interface MusicState {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  queue: MusicTrack[];
}
