import React, { useState, useEffect } from 'react';
import { Plus, Radio } from 'lucide-react';
import { VoiceChannel } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ChannelItem } from './ChannelItem.js';
import { ChannelModal } from './ChannelModal.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

export const ChannelList: React.FC = () => {
  const { user } = useAuth();
  const { socket, globalPresence } = useSocket();
  const { error, success } = useToast();

  const [channels, setChannels] = useState<VoiceChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de modais administrativos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState<VoiceChannel | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<VoiceChannel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const fetchChannels = async () => {
    try {
      const data = await api.getChannels();
      setChannels(data.channels);
    } catch (err: any) {
      error(err.message || 'Erro ao carregar canais');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  // Escuta atualizações de canais via Socket.IO
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

    const onChannelsReordered = (data: { channels: VoiceChannel[] }) => {
      setChannels(data.channels);
    };

    socket.on('channel:created', onChannelCreated);
    socket.on('channel:updated', onChannelUpdated);
    socket.on('channel:deleted', onChannelDeleted);
    socket.on('channels:reordered', onChannelsReordered);

    return () => {
      socket.off('channel:created', onChannelCreated);
      socket.off('channel:updated', onChannelUpdated);
      socket.off('channel:deleted', onChannelDeleted);
      socket.off('channels:reordered', onChannelsReordered);
    };
  }, [socket]);

  const handleOpenCreateModal = () => {
    setChannelToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (channel: VoiceChannel) => {
    setChannelToEdit(channel);
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

  return (
    <div className="flex-1 overflow-y-auto px-2 py-3">
      {/* Header da Seção de Canais */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 tracking-wider uppercase">
          <Radio className="w-3.5 h-3.5 text-brand-400" />
          <span>Canais de Voz</span>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-background-surface transition-colors"
            title="Criar novo canal de voz"
            aria-label="Criar canal de voz"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista de Canais */}
      {isLoading ? (
        <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
          Carregando canais...
        </div>
      ) : channels.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500">
          Nenhum canal de voz disponível
        </div>
      ) : (
        channels.map((channel) => (
          <ChannelItem
            key={channel.id}
            channel={channel}
            participants={globalPresence[channel.id] || []}
            onEdit={isAdmin ? handleOpenEditModal : undefined}
            onDelete={isAdmin ? (ch) => setChannelToDelete(ch) : undefined}
          />
        ))
      )}

      {/* Modal de Criação / Edição de Canais (Admin) */}
      <ChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        channelToEdit={channelToEdit}
        onSuccess={fetchChannels}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={!!channelToDelete}
        onClose={() => setChannelToDelete(null)}
        title="Excluir Canal de Voz"
        description="Esta ação removerá o canal e desconectará os participantes."
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-300">
            Tem certeza de que deseja excluir permanentemente o canal{' '}
            <strong className="text-white">"{channelToDelete?.name}"</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setChannelToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
