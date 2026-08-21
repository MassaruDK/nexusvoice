export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  avatar: string;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface VoiceChannel {
  id: string;
  name: string;
  description: string;
  position: number;
  created_at: string;
  updated_at: string;
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
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  duration?: number;
  addedBy: string;
  addedByAvatar: string;
}

export interface MusicState {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  queue: MusicTrack[];
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

export interface ChannelWithParticipants extends VoiceChannel {
  participants: ParticipantState[];
}

export interface JWTPayload {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}
