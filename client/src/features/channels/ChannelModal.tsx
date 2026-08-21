import React, { useState, useEffect } from 'react';
import { VoiceChannel } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelToEdit: VoiceChannel | null;
  onSuccess: () => void;
}

export const ChannelModal: React.FC<ChannelModalProps> = ({
  isOpen,
  onClose,
  channelToEdit,
  onSuccess,
}) => {
  const { error, success } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (channelToEdit) {
      setName(channelToEdit.name);
      setDescription(channelToEdit.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [channelToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error('O nome do canal é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      if (channelToEdit) {
        await api.updateChannel(channelToEdit.id, {
          name: name.trim(),
          description: description.trim(),
        });
        success('Canal atualizado com sucesso!');
      } else {
        await api.createChannel({
          name: name.trim(),
          description: description.trim(),
        });
        success('Canal criado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar canal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={channelToEdit ? 'Editar Canal de Voz' : 'Novo Canal de Voz'}
      description={
        channelToEdit
          ? 'Atualize as informações do canal de voz'
          : 'Crie uma nova sala para conversas em equipe'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Nome do Canal
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Geral, Games, Reuniões"
            className="w-full px-3.5 py-2.5 bg-background-surface border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Descrição (Opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Propósito da sala ou regras rápidas"
            rows={3}
            className="w-full px-3.5 py-2.5 bg-background-surface border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {channelToEdit ? 'Salvar Alterações' : 'Criar Canal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
