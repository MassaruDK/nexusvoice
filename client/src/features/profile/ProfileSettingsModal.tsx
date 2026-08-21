import React, { useState } from 'react';
import { User as UserIcon, Image, FileText, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Avatar } from '../ui/Avatar.js';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'Felix', 'Shadow', 'Cyber', 'Viper', 'Nova', 'Echo', 'Titan', 'Aura', 'Zero', 'Apex'
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPreset = (seed: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0284c7,38bdf8,0ea5e9`;
    setAvatar(newAvatar);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      error('O nome de usuário não pode ficar em branco');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        username: username.trim(),
        avatar: avatar.trim() || undefined,
        bio: bio.trim()
      });
      success('Perfil atualizado com sucesso!');
      onClose();
    } catch (err: any) {
      error(err.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil">
      <form onSubmit={handleSave} className="space-y-5">
        {/* Preview do Avatar e Bio */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-background-surface border border-background-border">
          <Avatar src={avatar} name={username || 'Usuário'} size="xl" />
          <div className="text-center sm:text-left min-w-0 flex-1">
            <p className="font-bold text-slate-100 text-base truncate">{username || 'Seu Nome'}</p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
              {bio || 'Nenhuma bio definida ainda.'}
            </p>
          </div>
        </div>

        {/* Nome de Usuário */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Nome de Exibição
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <UserIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome"
              maxLength={32}
              className="w-full pl-10 pr-4 py-2 bg-background-darkest border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>

        {/* URL da Foto de Perfil */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            URL da Foto de Perfil
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Image className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://exemplo.com/sua-foto.jpg"
              className="w-full pl-10 pr-4 py-2 bg-background-darkest border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          {/* Avatares Rápidos Prontos */}
          <div className="mt-2.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5 font-medium">
              <Sparkles className="w-3 h-3 text-brand-400" /> Ou escolha um avatar estilo Nexus:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-background-darkest hover:bg-brand-600/20 text-slate-300 hover:text-brand-300 border border-background-border text-xs transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bio / Descrição */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Sobre Você (Bio)
            </label>
            <span className="text-[10px] text-slate-500">{bio.length}/160</span>
          </div>
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Escreva algo legal sobre você..."
              maxLength={160}
              rows={3}
              className="w-full p-3 bg-background-darkest border border-background-border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-background-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} icon={<Check className="w-4 h-4" />}>
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
};
