export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private isSpeaking: boolean = false;
  private silenceTimer: number | null = null;
  private onSpeakingChange: (speaking: boolean) => void;
  
  // Parâmetros de calibração
  private threshold: number = 0.018; // Sensibilidade do microfone
  private holdTimeMs: number = 220;  // Histerese para não cortar a voz

  constructor(onSpeakingChange: (speaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange;
  }

  public start(stream: MediaStream): void {
    this.stop();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(buffer);
        
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length / 255;

        const isCurrentlyLoud = average > this.threshold;

        if (isCurrentlyLoud) {
          if (this.silenceTimer) {
            window.clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }

          if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.onSpeakingChange(true);
          }
        } else if (this.isSpeaking && !this.silenceTimer) {
          this.silenceTimer = window.setTimeout(() => {
            this.isSpeaking = false;
            this.silenceTimer = null;
            this.onSpeakingChange(false);
          }, this.holdTimeMs);
        }

        this.animationFrameId = requestAnimationFrame(checkAudioLevel);
      };

      this.animationFrameId = requestAnimationFrame(checkAudioLevel);
    } catch (err) {
      console.warn('[VAD] Não foi possível iniciar o detector de atividade de voz:', err);
    }
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.source) {
      try { this.source.disconnect(); } catch (_) {}
      this.source = null;
    }

    if (this.audioContext) {
      try { this.audioContext.close(); } catch (_) {}
      this.audioContext = null;
    }

    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.onSpeakingChange(false);
    }
  }
}
