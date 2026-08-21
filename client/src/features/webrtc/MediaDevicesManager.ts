import { MediaDeviceItem } from '../../types/index.js';

export class MediaDevicesManager {
  static async getDevices(): Promise<{
    audioInputs: MediaDeviceItem[];
    audioOutputs: MediaDeviceItem[];
    videoInputs: MediaDeviceItem[];
  }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { audioInputs: [], audioOutputs: [], videoInputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioInputs: MediaDeviceItem[] = [];
      const audioOutputs: MediaDeviceItem[] = [];
      const videoInputs: MediaDeviceItem[] = [];

      let micCount = 1;
      let camCount = 1;
      let speakerCount = 1;

      devices.forEach((device) => {
        const item: MediaDeviceItem = {
          deviceId: device.deviceId,
          label: device.label || '',
          groupId: device.groupId
        };

        if (device.kind === 'audioinput') {
          item.label = item.label || `Microfone ${micCount++}`;
          audioInputs.push(item);
        } else if (device.kind === 'audiooutput') {
          item.label = item.label || `Alto-falante ${speakerCount++}`;
          audioOutputs.push(item);
        } else if (device.kind === 'videoinput') {
          item.label = item.label || `Câmera ${camCount++}`;
          videoInputs.push(item);
        }
      });

      return { audioInputs, audioOutputs, videoInputs };
    } catch (err) {
      console.warn('[MEDIA_DEVICES] Erro ao enumerar dispositivos:', err);
      return { audioInputs: [], audioOutputs: [], videoInputs: [] };
    }
  }
}
