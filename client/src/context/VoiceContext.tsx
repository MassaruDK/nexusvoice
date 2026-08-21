import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { VoiceChannel, ParticipantState, MediaDeviceItem } from '../types/index.js';
import { useAuth } from './AuthContext.js';
import { useSocket } from './SocketContext.js';
import { useToast } from './ToastContext.js';
import { PeerConnectionManager } from '../features/webrtc/PeerConnectionManager.js';
import { VoiceActivityDetector } from '../features/webrtc/VoiceActivityDetector.js';
import { MediaDevicesManager } from '../features/webrtc/MediaDevicesManager.js';

interface VoiceContextType {
  currentChannel: VoiceChannel | null;
  participants: ParticipantState[];
  isJoined: boolean;
  isConnecting: boolean;
  
  // Estados de mídia
  isMuted: boolean;
  isDeafened: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
  isLocalSpeaking: boolean;
  speakingUsers: Set<string>; // Set de userIds falando
  
  // Streams
  localAudioStream: MediaStream | null;
  localVideoStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>; // socketId -> MediaStream
  
  // Ações de Voz
  joinChannel: (channel: VoiceChannel) => Promise<void>;
  leaveChannel: () => void;
  toggleMic: () => void;
  toggleDeafen: () => void;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  
  // Dispositivos
  audioInputs: MediaDeviceItem[];
  audioOutputs: MediaDeviceItem[];
  videoInputs: MediaDeviceItem[];
  selectedAudioInput: string;
  selectedAudioOutput: string;
  selectedVideoInput: string;
  changeAudioInput: (deviceId: string) => Promise<void>;
  changeAudioOutput: (deviceId: string) => Promise<void>;
  changeVideoInput: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { error, info, success } = useToast();

  const [currentChannel, setCurrentChannel] = useState<VoiceChannel | null>(null);
  const [participants, setParticipants] = useState<ParticipantState[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Estados locais de controle de áudio/vídeo
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [hasVideo, setHasVideo] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState<boolean>(false);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

  // Streams
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream | null>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  // Dispositivos
  const [audioInputs, setAudioInputs] = useState<MediaDeviceItem[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceItem[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceItem[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>(() => localStorage.getItem('voice_audio_in') || '');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>(() => localStorage.getItem('voice_audio_out') || '');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>(() => localStorage.getItem('voice_video_in') || '');

  // Referências para WebRTC e VAD
  const peerManagerRef = useRef<PeerConnectionManager | null>(null);
  const vadRef = useRef<VoiceActivityDetector | null>(null);

  // Carregar lista de dispositivos
  const refreshDevices = useCallback(async () => {
    const devices = await MediaDevicesManager.getDevices();
    setAudioInputs(devices.audioInputs);
    setAudioOutputs(devices.audioOutputs);
    setVideoInputs(devices.videoInputs);
  }, []);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  // Inicializar PeerConnectionManager
  useEffect(() => {
    const peerManager = new PeerConnectionManager({
      onTrackAdded: (socketId, stream) => {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.set(socketId, stream);
          return next;
        });
      },
      onTrackRemoved: (socketId) => {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(socketId);
          return next;
        });
      },
      onIceCandidate: (targetSocketId, candidate) => {
        if (socket?.connected) {
          socket.emit('webrtc:ice-candidate', { targetSocketId, candidate });
        }
      },
      onNegotiationNeeded: (targetSocketId) => {
        // Negociação automática tratada nas chamadas explícitas
      }
    });

    peerManagerRef.current = peerManager;

    return () => {
      peerManager.closeAll();
    };
  }, [socket]);

  // Inicializar VoiceActivityDetector
  useEffect(() => {
    const vad = new VoiceActivityDetector((speaking) => {
      setIsLocalSpeaking(speaking);
      if (user) {
        setSpeakingUsers(prev => {
          const next = new Set(prev);
          if (speaking) next.add(user.id);
          else next.delete(user.id);
          return next;
        });
      }

      if (socket?.connected && currentChannel) {
        socket.emit('media:speaking', { isSpeaking: speaking });
      }
    });

    vadRef.current = vad;

    return () => {
      vad.stop();
    };
  }, [socket, currentChannel, user]);

  // Registrar eventos Socket.IO para WebRTC e Canais
  useEffect(() => {
    if (!socket) return;

    // 1. Confirmação de entrada no canal
    const onVoiceJoined = async (data: { channelId: string; participants: ParticipantState[]; selfParticipant: ParticipantState }) => {
      setIsConnecting(false);
      setParticipants(data.participants);

      // Para cada participante existente no canal, cria uma oferta WebRTC
      for (const peer of data.participants) {
        if (peer.socketId !== socket.id) {
          try {
            console.log(`[VOICE] Iniciando WebRTC Offer para peer: ${peer.username} (${peer.socketId})`);
            const offer = await peerManagerRef.current?.createOffer(peer.socketId, peer.userId);
            if (offer) {
              socket.emit('webrtc:offer', { targetSocketId: peer.socketId, offer });
            }
          } catch (err) {
            console.warn('[VOICE] Erro ao criar offer para peer:', peer.username, err);
          }
        }
      }
    };

    // 2. Novo usuário entrou no canal
    const onUserJoined = (data: { participant: ParticipantState }) => {
      setParticipants(prev => {
        if (prev.some(p => p.userId === data.participant.userId)) {
          return prev.map(p => p.userId === data.participant.userId ? data.participant : p);
        }
        return [...prev, data.participant];
      });
      info(`${data.participant.username} entrou no canal`);
    };

    // 3. Usuário saiu do canal
    const onUserLeft = (data: { socketId: string; userId: string; channelId: string }) => {
      peerManagerRef.current?.removePeer(data.socketId);
      setParticipants(prev => {
        const left = prev.find(p => p.userId === data.userId);
        if (left) {
          info(`${left.username} saiu do canal`);
        }
        return prev.filter(p => p.userId !== data.userId);
      });
      setSpeakingUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    // 4. WebRTC Offer recebida
    const onWebRTCOffer = async (data: { fromSocketId: string; fromUserId: string; username: string; offer: any }) => {
      try {
        console.log(`[VOICE] Respondendo a WebRTC Offer de ${data.username} (${data.fromSocketId})`);
        const answer = await peerManagerRef.current?.handleOffer(data.fromSocketId, data.fromUserId, data.offer);
        if (answer) {
          socket.emit('webrtc:answer', { targetSocketId: data.fromSocketId, answer });
        }
      } catch (err) {
        console.warn('[VOICE] Erro ao responder offer de:', data.username, err);
      }
    };

    // 5. WebRTC Answer recebida
    const onWebRTCAnswer = async (data: { fromSocketId: string; answer: any }) => {
      try {
        await peerManagerRef.current?.handleAnswer(data.fromSocketId, data.answer);
      } catch (err) {
        console.warn('[VOICE] Erro ao processar answer de:', data.fromSocketId, err);
      }
    };

    // 6. ICE Candidate recebido
    const onWebRTCIce = async (data: { fromSocketId: string; candidate: any }) => {
      await peerManagerRef.current?.handleIceCandidate(data.fromSocketId, data.candidate);
    };

    // 7. Atualização de mídia de outro membro
    const onMediaStateChanged = (data: { socketId: string; userId: string; mediaState: Partial<ParticipantState> }) => {
      setParticipants(prev => prev.map(p => {
        if (p.userId === data.userId) {
          return { ...p, ...data.mediaState };
        }
        return p;
      }));
    };

    // 8. Evento de fala de outro membro
    const onMediaSpeaking = (data: { socketId: string; userId: string; isSpeaking: boolean }) => {
      setSpeakingUsers(prev => {
        const next = new Set(prev);
        if (data.isSpeaking) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });

      setParticipants(prev => prev.map(p => {
        if (p.userId === data.userId) {
          return { ...p, isSpeaking: data.isSpeaking };
        }
        return p;
      }));
    };

    // 9. Erro de canal
    const onVoiceError = (data: { message: string }) => {
      error(data.message);
      leaveChannel();
    };

    socket.on('voice:joined', onVoiceJoined);
    socket.on('voice:user_joined', onUserJoined);
    socket.on('voice:user_left', onUserLeft);
    socket.on('webrtc:offer', onWebRTCOffer);
    socket.on('webrtc:answer', onWebRTCAnswer);
    socket.on('webrtc:ice-candidate', onWebRTCIce);
    socket.on('media:state_changed', onMediaStateChanged);
    socket.on('media:speaking', onMediaSpeaking);
    socket.on('voice:error', onVoiceError);

    return () => {
      socket.off('voice:joined', onVoiceJoined);
      socket.off('voice:user_joined', onUserJoined);
      socket.off('voice:user_left', onUserLeft);
      socket.off('webrtc:offer', onWebRTCOffer);
      socket.off('webrtc:answer', onWebRTCAnswer);
      socket.off('webrtc:ice-candidate', onWebRTCIce);
      socket.off('media:state_changed', onMediaStateChanged);
      socket.off('media:speaking', onMediaSpeaking);
      socket.off('voice:error', onVoiceError);
    };
  }, [socket, info, error]);

  // Ação: Entrar no canal de voz
  const joinChannel = async (channel: VoiceChannel) => {
    if (!socket?.connected) {
      error('Sem conexão com o servidor em tempo real');
      return;
    }

    if (currentChannel?.id === channel.id) {
      return;
    }

    // Se já estiver em outro canal, limpa estado antes
    if (currentChannel) {
      leaveChannel();
    }

    setIsConnecting(true);
    setCurrentChannel(channel);

    try {
      // 1. Solicita acesso ao microfone
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
          video: false
        });
      } catch (micErr: any) {
        console.warn('[VOICE] Permissão de microfone negada ou indisponível:', micErr);
        info('Entrando no canal em modo apenas ouvinte (microfone não detectado ou negado)');
      }

      if (stream) {
        setLocalAudioStream(stream);
        peerManagerRef.current?.setLocalAudioStream(stream);
        vadRef.current?.start(stream);
        setIsMuted(false);
      } else {
        setIsMuted(true);
      }

      // 2. Notifica servidor para entrar no canal
      socket.emit('voice:join', {
        channelId: channel.id,
        mediaState: {
          isMuted: !stream,
          isDeafened: false,
          hasVideo: false,
          isScreenSharing: false
        }
      });

      refreshDevices();
    } catch (err: any) {
      console.error('[VOICE] Falha ao entrar no canal:', err);
      error('Não foi possível entrar no canal de voz');
      setIsConnecting(false);
      setCurrentChannel(null);
    }
  };

  // Ação: Sair do canal de voz
  const leaveChannel = useCallback(() => {
    if (socket?.connected && currentChannel) {
      socket.emit('voice:leave');
    }

    // Parar todas as tracks locais
    localAudioStream?.getTracks().forEach(t => t.stop());
    localVideoStream?.getTracks().forEach(t => t.stop());
    localScreenStream?.getTracks().forEach(t => t.stop());

    setLocalAudioStream(null);
    setLocalVideoStream(null);
    setLocalScreenStream(null);
    setRemoteStreams(new Map());

    // Parar VAD e WebRTC
    vadRef.current?.stop();
    peerManagerRef.current?.closeAll();

    // Resetar estados
    setCurrentChannel(null);
    setParticipants([]);
    setIsConnecting(false);
    setIsMuted(false);
    setIsDeafened(false);
    setHasVideo(false);
    setIsScreenSharing(false);
    setIsLocalSpeaking(false);
    setSpeakingUsers(new Set());
  }, [socket, currentChannel, localAudioStream, localVideoStream, localScreenStream]);

  // Ação: Mutar / Desmutar Microfone
  const toggleMic = () => {
    if (!localAudioStream) {
      info('Microfone não disponível');
      return;
    }

    const nextMuted = !isMuted;
    localAudioStream.getAudioTracks().forEach(track => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);

    if (nextMuted) {
      vadRef.current?.stop();
      setIsLocalSpeaking(false);
      if (user) {
        setSpeakingUsers(prev => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      }
    } else {
      vadRef.current?.start(localAudioStream);
    }

    if (socket?.connected && currentChannel) {
      socket.emit('media:state_changed', { isMuted: nextMuted });
    }
  };

  // Ação: Ensurdecer / Desensurdecer
  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);

    // Ensurdecer também muta o microfone
    if (nextDeafened) {
      if (localAudioStream) {
        localAudioStream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
      setIsMuted(true);
      vadRef.current?.stop();
    } else {
      if (localAudioStream) {
        localAudioStream.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
      }
      setIsMuted(false);
      if (localAudioStream) {
        vadRef.current?.start(localAudioStream);
      }
    }

    peerManagerRef.current?.setDeafened(nextDeafened);

    if (socket?.connected && currentChannel) {
      socket.emit('media:state_changed', {
        isDeafened: nextDeafened,
        isMuted: nextDeafened ? true : isMuted
      });
    }
  };

  // Ação: Ligar / Desligar Câmera
  const toggleCamera = async () => {
    if (hasVideo) {
      // Desligar Câmera
      localVideoStream?.getTracks().forEach(t => t.stop());
      setLocalVideoStream(null);
      setHasVideo(false);
      peerManagerRef.current?.setLocalVideoStream(null);

      if (socket?.connected && currentChannel) {
        socket.emit('media:state_changed', { hasVideo: false });
      }
    } else {
      // Ligar Câmera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : true,
          audio: false
        });

        setLocalVideoStream(stream);
        setHasVideo(true);
        peerManagerRef.current?.setLocalVideoStream(stream);

        if (socket?.connected && currentChannel) {
          socket.emit('media:state_changed', { hasVideo: true });
        }
      } catch (err: any) {
        console.warn('[CAMERA] Não foi possível acessar a câmera:', err);
        error('Acesso à câmera foi negado ou não encontrado');
      }
    }
  };

  // Ação: Compartilhar / Parar Tela
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Parar Compartilhamento
      localScreenStream?.getTracks().forEach(t => t.stop());
      setLocalScreenStream(null);
      setIsScreenSharing(false);
      peerManagerRef.current?.setLocalScreenStream(null);

      if (socket?.connected && currentChannel) {
        socket.emit('media:state_changed', { isScreenSharing: false });
      }
      info('Compartilhamento de tela encerrado');
    } else {
      // Iniciar Compartilhamento
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          error('Seu navegador não suporta compartilhamento de tela');
          return;
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        const screenTrack = stream.getVideoTracks()[0];
        
        // Trata cancelamento pelo botão padrão do navegador
        screenTrack.onended = () => {
          localScreenStream?.getTracks().forEach(t => t.stop());
          setLocalScreenStream(null);
          setIsScreenSharing(false);
          peerManagerRef.current?.setLocalScreenStream(null);

          if (socket?.connected && currentChannel) {
            socket.emit('media:state_changed', { isScreenSharing: false });
          }
          info('Compartilhamento de tela finalizado');
        };

        setLocalScreenStream(stream);
        setIsScreenSharing(true);
        peerManagerRef.current?.setLocalScreenStream(stream);

        if (socket?.connected && currentChannel) {
          socket.emit('media:state_changed', { isScreenSharing: true });
        }
        success('Compartilhamento de tela iniciado');
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          console.warn('[SCREEN] Falha ao compartilhar tela:', err);
          error('Não foi possível iniciar o compartilhamento');
        }
      }
    }
  };

  // Troca de Dispositivos
  const changeAudioInput = async (deviceId: string) => {
    setSelectedAudioInput(deviceId);
    localStorage.setItem('voice_audio_in', deviceId);

    if (localAudioStream && currentChannel) {
      try {
        localAudioStream.getTracks().forEach(t => t.stop());
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } }
        });
        setLocalAudioStream(newStream);
        peerManagerRef.current?.setLocalAudioStream(newStream);
        vadRef.current?.start(newStream);
        success('Microfone alterado com sucesso');
      } catch (err) {
        error('Falha ao trocar dispositivo de microfone');
      }
    }
  };

  const changeAudioOutput = async (deviceId: string) => {
    setSelectedAudioOutput(deviceId);
    localStorage.setItem('voice_audio_out', deviceId);
    success('Dispositivo de saída selecionado');
  };

  const changeVideoInput = async (deviceId: string) => {
    setSelectedVideoInput(deviceId);
    localStorage.setItem('voice_video_in', deviceId);

    if (hasVideo && currentChannel) {
      try {
        localVideoStream?.getTracks().forEach(t => t.stop());
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } }
        });
        setLocalVideoStream(newStream);
        peerManagerRef.current?.setLocalVideoStream(newStream);
        success('Câmera alterada com sucesso');
      } catch (err) {
        error('Falha ao trocar de câmera');
      }
    }
  };

  return (
    <VoiceContext.Provider value={{
      currentChannel,
      participants,
      isJoined: !!currentChannel,
      isConnecting,
      isMuted,
      isDeafened,
      hasVideo,
      isScreenSharing,
      isLocalSpeaking,
      speakingUsers,
      localAudioStream,
      localVideoStream,
      localScreenStream,
      remoteStreams,
      joinChannel,
      leaveChannel,
      toggleMic,
      toggleDeafen,
      toggleCamera,
      toggleScreenShare,
      audioInputs,
      audioOutputs,
      videoInputs,
      selectedAudioInput,
      selectedAudioOutput,
      selectedVideoInput,
      changeAudioInput,
      changeAudioOutput,
      changeVideoInput,
      refreshDevices
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice deve ser usado dentro de um VoiceProvider');
  }
  return context;
};
