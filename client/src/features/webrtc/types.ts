export interface PeerMediaTracks {
  audioTrack?: MediaStreamTrack;
  videoTrack?: MediaStreamTrack;
  screenTrack?: MediaStreamTrack;
  stream: MediaStream;
}

export interface PeerConnectionWrapper {
  peerConnection: RTCPeerConnection;
  remoteSocketId: string;
  userId: string;
  remoteStream: MediaStream;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}
