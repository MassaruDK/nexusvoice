import React, { useState, useEffect } from 'react';
import { Plus, Radio, Hash, Volume2 } from 'lucide-react';
import { VoiceChannel } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { useVoice } from '../../context/VoiceContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ChannelItem } from './ChannelItem.js';
import { ChannelModal } from './ChannelModal.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

interface ChannelListProps {
  selectedTextChannelId: string | null;
  onSelectTextChannel: (channel: VoiceChannel) => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  selectedTextChannelId,
  onSelectTextChannel,
}) => {
  const { user } = useAuth();
  const { socket, globalPresence } = useSocket();
  const { currentChannel: currentVoiceChannel, joinChannel } = useVoice();
  const { error, success } = useToast();

  const [channels, setChannels] = useState<VoiceChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelTypeToCreate, setChannelTypeToCreate] = useState<'VOICE' | 'TEXT'>('VOICE');
  const [channelToEdit, setChannelToEdit] = useState<VoiceChannel | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<VoiceChannel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const fetchChannels = async () => {
    try {
      const data = await api.getChannels();
      setChannels(data.channels);

      // Se nenhum canal de texto estiver selecionado, seleciona o primeiro canal de texto por padrão
      const textChannels = data.channels.filter((c) => c.type === 'TEXT');
      if (textChannels.length > 0 && !selectedTextChannelId) {
        onSelectTextChannel(textChannels[0]);
      }
    } catch (err: any) {
      error(err.message || 'Erro ao carregar canais');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onChannelCreated = (data: { channel: VoiceChannel }) => {
      setChannels((prev) => [...prev, data.channel].sort((a, b) => a.position - b.position));
    };

    const onChannelUpdated = (data: { channel: VoiceChannel }) => {
      setChannels((prev) =>
        prev.map((ch) => (ch.id === data.channel.id ? data.channel : ch)).sort((a, b) => a.position - b.position)
      );
    };

    const onChannelDeleted = (data: { channelId: string }) => {
      setChannels((prev) => prev.filter((ch) => ch.id !== data.channelId));
    };

    socket.on('channel:created', onChannelCreated);
    socket.on('channel:updated', onChannelUpdated);
    socket.on('channel:deleted', onChannelDeleted);

    return () => {
      socket.off('channel:created', onChannelCreated);
      socket.off('channel:updated', onChannelUpdated);
      socket.off('channel:deleted', onChannelDeleted);
    };
  }, [socket]);

  const handleOpenCreateModal = (type: 'VOICE' | 'TEXT') => {
    setChannelTypeToCreate(type);
    setChannelToEdit(null);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!channelToDelete) return;

    setIsDeleting(true);
    try {
      await api.deleteChannel(channelToDelete.id);
      success('Canal excluído com sucesso');
      setChannelToDelete(null);
      fetchChannels();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir canal');
    } finally {
      setIsDeleting(false);
    }
  };

  const textChannels = channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = channels.filter((c) => c.type !== 'TEXT');

  return (
    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-6">
      {/* 1. SEÇÃO DE CANAIS DE TEXTO */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 tracking-wider uppercase">
            <Hash className="w-3.5 h-3.5 text-brand-400" />
            <span>Canais de Texto</span>
          </div>

          {isAdmin && (
            <button
              onClick={() => handleOpenCreateModal('TEXT')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-background-surface transition-colors"
              title="Criar canal de texto"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-0.5">
          {textChannels.map((channel) => {
            const isSelected = selectedTextChannelId === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => onSelectTextChannel(channel)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-background-hover'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Hash className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  <span className="truncate font-semibold">{channel.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SEÇÃO DE CANAIS DE VOZ */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 tracking-wider uppercase">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Canais de Voz</span>
          </div>

          {isAdmin && (
            <button
              onClick={() => handleOpenCreateModal('VOICE')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-background-surface transition-colors"
              title="Criar canal de voz"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {voiceChannels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              participants={globalPresence[channel.id] || []}
              onEdit={isAdmin ? (ch) => { setChannelToEdit(ch); setIsModalOpen(true); } : undefined}
              onDelete={isAdmin ? (ch) => setChannelToDelete(ch) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      <ChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        channelToEdit={channelToEdit}
        defaultType={channelTypeToCreate}
        onSuccess={fetchChannels}
      />

      {/* Modal de Exclusão */}
      <Modal
        isOpen={!!channelToDelete}
        onClose={() => setChannelToDelete(null)}
        title="Excluir Canal"
        description="Esta ação removerá o canal permanentemente."
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-300">
            Tem certeza de que deseja excluir o canal <strong className="text-white">"{channelToDelete?.name}"</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setChannelToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} isLoading={isDeleting}>
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
