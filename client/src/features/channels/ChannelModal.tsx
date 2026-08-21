import React, { useState, useEffect } from 'react';
import { Hash, Volume2 } from 'lucide-react';
import { VoiceChannel, ChannelType } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelToEdit?: VoiceChannel | null;
  defaultType?: ChannelType;
  onSuccess: () => void;
}

export const ChannelModal: React.FC<ChannelModalProps> = ({
  isOpen,
  onClose,
  channelToEdit,
  defaultType = 'VOICE',
  onSuccess,
}) => {
  const { error, success } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChannelType>(defaultType);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (channelToEdit) {
      setName(channelToEdit.name);
      setDescription(channelToEdit.description || '');
      setType(channelToEdit.type || 'VOICE');
    } else {
      setName('');
      setDescription('');
      setType(defaultType);
    }
  }, [channelToEdit, defaultType, isOpen]);

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
          description: description.trim() || undefined,
        });
        success('Canal atualizado com sucesso!');
      } else {
        await api.createChannel({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
        } as any);
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
      title={channelToEdit ? 'Editar Canal' : 'Criar Novo Canal'}
      description={channelToEdit ? 'Altere os dados do canal' : 'Defina os dados para o novo canal'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Tipo de Canal */}
        {!channelToEdit && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Tipo do Canal
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('TEXT')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === 'TEXT'
                    ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                    : 'bg-background-darkest border-background-border text-slate-400 hover:text-white'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>Canal de Texto</span>
              </button>

              <button
                type="button"
                onClick={() => setType('VOICE')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === 'VOICE'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-background-darkest border-background-border text-slate-400 hover:text-white'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Canal de Voz</span>
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Nome do Canal
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'TEXT' ? 'geral, anúncios, memes' : 'Geral, Lounge, Games'}
            maxLength={32}
            className="w-full px-3.5 py-2.5 bg-background-darkest border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Descrição (Opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sobre o que é este canal?"
            maxLength={100}
            rows={2}
            className="w-full p-3 bg-background-darkest border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-background-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {channelToEdit ? 'Salvar Alterações' : 'Criar Canal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
