import { Server, Socket } from 'socket.io';
import { SafeUser, MusicState, MusicTrack } from '../types/index.js';

class MusicManager {
  private rooms = new Map<string, MusicState>();

  getRoomState(channelId: string): MusicState {
    if (!this.rooms.has(channelId)) {
      this.rooms.set(channelId, {
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now(),
        queue: []
      });
    }

    const state = this.rooms.get(channelId)!;
    if (state.isPlaying && state.currentTrack) {
      const elapsed = (Date.now() - state.lastUpdated) / 1000;
      state.currentTime += elapsed;
      state.lastUpdated = Date.now();
    }

    return state;
  }

  playTrack(channelId: string, track: MusicTrack): MusicState {
    const state = this.getRoomState(channelId);
    state.currentTrack = track;
    state.isPlaying = true;
    state.currentTime = 0;
    state.lastUpdated = Date.now();
    return state;
  }

  setPlaying(channelId: string, isPlaying: boolean, currentTime?: number): MusicState {
    const state = this.getRoomState(channelId);
    state.isPlaying = isPlaying;
    if (currentTime !== undefined) {
      state.currentTime = currentTime;
    }
    state.lastUpdated = Date.now();
    return state;
  }

  seek(channelId: string, time: number): MusicState {
    const state = this.getRoomState(channelId);
    state.currentTime = Math.max(0, time);
    state.lastUpdated = Date.now();
    return state;
  }

  addToQueue(channelId: string, track: MusicTrack): MusicState {
    const state = this.getRoomState(channelId);
    if (!state.currentTrack) {
      return this.playTrack(channelId, track);
    }
    state.queue.push(track);
    return state;
  }

  skip(channelId: string): MusicState {
    const state = this.getRoomState(channelId);
    if (state.queue.length > 0) {
      const nextTrack = state.queue.shift()!;
      state.currentTrack = nextTrack;
      state.isPlaying = true;
      state.currentTime = 0;
      state.lastUpdated = Date.now();
    } else {
      state.currentTrack = null;
      state.isPlaying = false;
      state.currentTime = 0;
      state.lastUpdated = Date.now();
    }
    return state;
  }

  stop(channelId: string): MusicState {
    const state = this.getRoomState(channelId);
    state.currentTrack = null;
    state.isPlaying = false;
    state.currentTime = 0;
    state.lastUpdated = Date.now();
    state.queue = [];
    return state;
  }
}

export const musicManager = new MusicManager();

export function registerMusicHandlers(io: Server, socket: Socket, user: SafeUser): void {
  socket.on('music:request_sync', (data: { channelId: string }) => {
    const state = musicManager.getRoomState(data.channelId);
    socket.emit('music:sync', { state });
  });

  socket.on('music:play_track', (data: { channelId: string; track: MusicTrack }) => {
    const state = musicManager.playTrack(data.channelId, data.track);
    io.to(`channel:${data.channelId}`).emit('music:sync', { state, action: 'play' });
  });

  socket.on('music:add_queue', (data: { channelId: string; track: MusicTrack }) => {
    const state = musicManager.addToQueue(data.channelId, data.track);
    io.to(`channel:${data.channelId}`).emit('music:sync', { state, action: 'queue' });
  });

  socket.on('music:toggle_play', (data: { channelId: string; isPlaying: boolean; currentTime?: number }) => {
    const state = musicManager.setPlaying(data.channelId, data.isPlaying, data.currentTime);
    io.to(`channel:${data.channelId}`).emit('music:sync', { state, action: data.isPlaying ? 'play' : 'pause' });
  });

  socket.on('music:seek', (data: { channelId: string; time: number }) => {
    const state = musicManager.seek(data.channelId, data.time);
    io.to(`channel:${data.channelId}`).emit('music:sync', { state, action: 'seek' });
  });

  socket.on('music:skip', (data: { channelId: string }) => {
    const state = musicManager.skip(data.channelId);
    io.to(`channel:${data.channelId}`).emit('music:sync', { state, action: 'skip' });
  });

  socket.on('music:stop', (data: { channelId: string }) => {
    const state = musicManager.stop(data.channelId);
    io.to(`channel:${data.channelId}`).emit('music:sync', { state, action: 'stop' });
  });
}
