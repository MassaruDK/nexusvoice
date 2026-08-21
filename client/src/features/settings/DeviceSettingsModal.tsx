import React, { useEffect, useState, useRef } from 'react';
import { Mic, Volume2, Video, Activity } from 'lucide-react';
import { useVoice } from '../../context/VoiceContext.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    changeAudioInput,
    changeAudioOutput,
    changeVideoInput,
    refreshDevices,
  } = useVoice();

  // Testador de Microfone Visual
  const [micTestLevel, setMicTestLevel] = useState(0);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const testStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshDevices();
    } else {
      stopMicTest();
    }
  }, [isOpen, refreshDevices]);

  const startMicTest = async () => {
    try {
      stopMicTest();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
      });
      testStreamRef.current = stream;
      setIsTestingMic(true);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const level = Math.min(100, Math.round((sum / dataArray.length / 255) * 160));
        setMicTestLevel(level);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('[SETTINGS] Falha no teste de mic:', err);
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    setIsTestingMic(false);
    setMicTestLevel(0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopMicTest();
        onClose();
      }}
      title="Configurações de Voz & Vídeo"
      description="Selecione e teste seus dispositivos de entrada e saída"
    >
      <div className="space-y-5 pt-2">
        {/* Microfone (Entrada de Áudio) */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            <Mic className="w-4 h-4 text-brand-400" />
            Dispositivo de Entrada (Microfone)
          </label>
          <select
            value={selectedAudioInput}
            onChange={(e) => changeAudioInput(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-background-surface border border-background-border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Padrão do Sistema</option>
            {audioInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>

          {/* Medidor de Teste do Microfone */}
          <div className="mt-3 p-3 rounded-xl bg-background-surface/70 border border-background-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-300 font-medium">Testar Microfone</span>
              <button
                type="button"
                onClick={isTestingMic ? stopMicTest : startMicTest}
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                {isTestingMic ? 'Parar Teste' : 'Iniciar Teste'}
              </button>
            </div>
            <div className="w-full h-2.5 bg-background-darkest rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-accent-cyan to-brand-500 transition-all duration-75"
                style={{ width: `${micTestLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Alto-falantes (Saída de Áudio) */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            <Volume2 className="w-4 h-4 text-accent-cyan" />
            Dispositivo de Saída (Alto-falante / Fone)
          </label>
          <select
            value={selectedAudioOutput}
            onChange={(e) => changeAudioOutput(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-background-surface border border-background-border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Padrão do Sistema</option>
            {audioOutputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Câmera (Vídeo) */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            <Video className="w-4 h-4 text-violet-400" />
            Câmera
          </label>
          <select
            value={selectedVideoInput}
            onChange={(e) => changeVideoInput(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-background-surface border border-background-border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Padrão do Sistema</option>
            {videoInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            onClick={() => {
              stopMicTest();
              onClose();
            }}
          >
            Concluído
          </Button>
        </div>
      </div>
    </Modal>
  );
};
