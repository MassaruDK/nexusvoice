import { ParticipantState, SafeUser } from '../types/index.js';

class PresenceManager {
  private channelParticipants = new Map<string, Map<string, ParticipantState>>();
  private socketToSession = new Map<string, { userId: string; channelId: string }>();

  joinChannel(
    socketId: string,
    user: SafeUser,
    channelId: string,
    initialMediaState: { isMuted?: boolean; isDeafened?: boolean; hasVideo?: boolean; isScreenSharing?: boolean } = {}
  ): { participant: ParticipantState; previousChannelId?: string } {
    let previousChannelId: string | undefined;

    if (this.socketToSession.has(socketId)) {
      const prev = this.socketToSession.get(socketId)!;
      previousChannelId = prev.channelId;
      this.leaveChannel(socketId);
    }

    if (!this.channelParticipants.has(channelId)) {
      this.channelParticipants.set(channelId, new Map());
    }

    const participant: ParticipantState = {
      socketId,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      channelId,
      isMuted: initialMediaState.isMuted ?? false,
      isDeafened: initialMediaState.isDeafened ?? false,
      hasVideo: initialMediaState.hasVideo ?? false,
      isScreenSharing: initialMediaState.isScreenSharing ?? false,
      isSpeaking: false,
      joinedAt: new Date().toISOString()
    };

    this.channelParticipants.get(channelId)!.set(user.id, participant);
    this.socketToSession.set(socketId, { userId: user.id, channelId });

    return { participant, previousChannelId };
  }

  leaveChannel(socketId: string): { leftParticipant?: ParticipantState; channelId?: string } {
    const session = this.socketToSession.get(socketId);
    if (!session) return {};

    const { userId, channelId } = session;
    this.socketToSession.delete(socketId);

    const channelMap = this.channelParticipants.get(channelId);
    if (!channelMap) return { channelId };

    const leftParticipant = channelMap.get(userId);
    channelMap.delete(userId);

    if (channelMap.size === 0) {
      this.channelParticipants.delete(channelId);
    }

    return { leftParticipant, channelId };
  }

  updateMediaState(
    socketId: string,
    state: Partial<Pick<ParticipantState, 'isMuted' | 'isDeafened' | 'hasVideo' | 'isScreenSharing'>>
  ): ParticipantState | null {
    const session = this.socketToSession.get(socketId);
    if (!session) return null;

    const channelMap = this.channelParticipants.get(session.channelId);
    if (!channelMap) return null;

    const participant = channelMap.get(session.userId);
    if (!participant) return null;

    if (state.isMuted !== undefined) participant.isMuted = state.isMuted;
    if (state.isDeafened !== undefined) participant.isDeafened = state.isDeafened;
    if (state.hasVideo !== undefined) participant.hasVideo = state.hasVideo;
    if (state.isScreenSharing !== undefined) participant.isScreenSharing = state.isScreenSharing;

    return participant;
  }

  updateSpeakingState(socketId: string, isSpeaking: boolean): ParticipantState | null {
    const session = this.socketToSession.get(socketId);
    if (!session) return null;

    const channelMap = this.channelParticipants.get(session.channelId);
    if (!channelMap) return null;

    const participant = channelMap.get(session.userId);
    if (!participant) return null;

    participant.isSpeaking = isSpeaking;
    return participant;
  }

  getChannelParticipants(channelId: string): ParticipantState[] {
    const channelMap = this.channelParticipants.get(channelId);
    if (!channelMap) return [];
    return Array.from(channelMap.values());
  }

  getAllPresence(): Record<string, ParticipantState[]> {
    const result: Record<string, ParticipantState[]> = {};
    for (const [channelId, map] of this.channelParticipants.entries()) {
      result[channelId] = Array.from(map.values());
    }
    return result;
  }

  getSession(socketId: string) {
    return this.socketToSession.get(socketId);
  }
}

export const presence = new PresenceManager();
