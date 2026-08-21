import { PeerConnectionWrapper } from './types.js';

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

export class PeerConnectionManager {
  private peers = new Map<string, PeerConnectionWrapper>();
  private localAudioStream: MediaStream | null = null;
  private localVideoStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private isDeafened: boolean = false;

  private onTrackAdded: (socketId: string, stream: MediaStream) => void;
  private onTrackRemoved: (socketId: string) => void;
  private onIceCandidate: (targetSocketId: string, candidate: RTCIceCandidate) => void;
  private onNegotiationNeeded: (targetSocketId: string) => void;

  constructor(handlers: {
    onTrackAdded: (socketId: string, stream: MediaStream) => void;
    onTrackRemoved: (socketId: string) => void;
    onIceCandidate: (targetSocketId: string, candidate: RTCIceCandidate) => void;
    onNegotiationNeeded: (targetSocketId: string) => void;
  }) {
    this.onTrackAdded = handlers.onTrackAdded;
    this.onTrackRemoved = handlers.onTrackRemoved;
    this.onIceCandidate = handlers.onIceCandidate;
    this.onNegotiationNeeded = handlers.onNegotiationNeeded;
  }

  public setLocalAudioStream(stream: MediaStream | null): void {
    this.localAudioStream = stream;
    this.updateTracksInPeers();
  }

  public setLocalVideoStream(stream: MediaStream | null): void {
    this.localVideoStream = stream;
    this.updateTracksInPeers();
  }

  public setLocalScreenStream(stream: MediaStream | null): void {
    this.localScreenStream = stream;
    this.updateTracksInPeers();
  }

  public setDeafened(deafened: boolean): void {
    this.isDeafened = deafened;
    // Muta todos os áudios remotos
    for (const wrapper of this.peers.values()) {
      wrapper.remoteStream.getAudioTracks().forEach(track => {
        track.enabled = !deafened;
      });
    }
  }

  private createPeerConnection(remoteSocketId: string, userId: string): PeerConnectionWrapper {
    if (this.peers.has(remoteSocketId)) {
      return this.peers.get(remoteSocketId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: DEFAULT_ICE_SERVERS
    });

    const remoteStream = new MediaStream();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(remoteSocketId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WEBRTC] Faixa de mídia recebida de ${remoteSocketId} (${event.track.kind})`);
      
      // Adiciona faixa ao stream remoto
      if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
        remoteStream.addTrack(event.track);
      }

      if (event.track.kind === 'audio') {
        event.track.enabled = !this.isDeafened;
      }

      this.onTrackAdded(remoteSocketId, remoteStream);

      event.track.onended = () => {
        remoteStream.removeTrack(event.track);
        if (remoteStream.getTracks().length === 0) {
          this.onTrackRemoved(remoteSocketId);
        }
      };
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WEBRTC] ICE State com ${remoteSocketId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        // Conexão perdida
      }
    };

    // Adiciona tracks locais atuais
    this.addLocalTracksToPc(pc);

    const wrapper: PeerConnectionWrapper = {
      peerConnection: pc,
      remoteSocketId,
      userId,
      remoteStream
    };

    this.peers.set(remoteSocketId, wrapper);
    return wrapper;
  }

  private addLocalTracksToPc(pc: RTCPeerConnection): void {
    const existingSenders = pc.getSenders();

    // 1. Áudio Local
    if (this.localAudioStream) {
      const audioTrack = this.localAudioStream.getAudioTracks()[0];
      if (audioTrack && !existingSenders.some(s => s.track?.kind === 'audio')) {
        pc.addTrack(audioTrack, this.localAudioStream);
      }
    }

    // 2. Vídeo / Tela Local (Tela tem prioridade de exibição de vídeo se ativa)
    const videoTrack = (this.localScreenStream?.getVideoTracks()[0]) || (this.localVideoStream?.getVideoTracks()[0]);
    if (videoTrack && !existingSenders.some(s => s.track?.kind === 'video')) {
      const stream = this.localScreenStream || this.localVideoStream!;
      pc.addTrack(videoTrack, stream);
    }
  }

  public updateTracksInPeers(): void {
    for (const [remoteSocketId, wrapper] of this.peers.entries()) {
      const pc = wrapper.peerConnection;
      const senders = pc.getSenders();

      // Atualiza Áudio
      const currentAudioTrack = this.localAudioStream?.getAudioTracks()[0] || null;
      const audioSender = senders.find(s => s.track?.kind === 'audio');

      if (audioSender) {
        if (currentAudioTrack) {
          audioSender.replaceTrack(currentAudioTrack);
        } else {
          try { pc.removeTrack(audioSender); } catch (_) {}
        }
      } else if (currentAudioTrack && this.localAudioStream) {
        pc.addTrack(currentAudioTrack, this.localAudioStream);
      }

      // Atualiza Vídeo / Tela
      const currentVideoTrack = (this.localScreenStream?.getVideoTracks()[0]) || (this.localVideoStream?.getVideoTracks()[0]) || null;
      const currentVideoStream = this.localScreenStream || this.localVideoStream;
      const videoSender = senders.find(s => s.track?.kind === 'video');

      if (videoSender) {
        if (currentVideoTrack) {
          videoSender.replaceTrack(currentVideoTrack);
        } else {
          try { pc.removeTrack(videoSender); } catch (_) {}
        }
      } else if (currentVideoTrack && currentVideoStream) {
        pc.addTrack(currentVideoTrack, currentVideoStream);
      }
    }
  }

  // Cria e envia Offer para um peer
  public async createOffer(remoteSocketId: string, userId: string): Promise<RTCSessionDescriptionInit> {
    const wrapper = this.createPeerConnection(remoteSocketId, userId);
    const offer = await wrapper.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await wrapper.peerConnection.setLocalDescription(offer);
    return offer;
  }

  // Trata Offer recebida de um peer remoto
  public async handleOffer(remoteSocketId: string, userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const wrapper = this.createPeerConnection(remoteSocketId, userId);
    await wrapper.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await wrapper.peerConnection.createAnswer();
    await wrapper.peerConnection.setLocalDescription(answer);
    return answer;
  }

  // Trata Answer recebida
  public async handleAnswer(remoteSocketId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const wrapper = this.peers.get(remoteSocketId);
    if (!wrapper) return;
    await wrapper.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  // Trata ICE Candidate
  public async handleIceCandidate(remoteSocketId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const wrapper = this.peers.get(remoteSocketId);
    if (!wrapper) return;

    try {
      await wrapper.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[WEBRTC] Erro ao adicionar ICE candidate:', err);
    }
  }

  public removePeer(remoteSocketId: string): void {
    const wrapper = this.peers.get(remoteSocketId);
    if (wrapper) {
      wrapper.peerConnection.close();
      this.peers.delete(remoteSocketId);
      this.onTrackRemoved(remoteSocketId);
    }
  }

  public closeAll(): void {
    for (const [socketId, wrapper] of this.peers.entries()) {
      wrapper.peerConnection.close();
      this.onTrackRemoved(socketId);
    }
    this.peers.clear();
  }
}
