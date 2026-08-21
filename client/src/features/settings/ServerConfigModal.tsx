import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, XCircle, RefreshCw, Globe } from 'lucide-react';
import { getBackendUrl, setCustomBackendUrl, api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ isOpen, onClose }) => {
  const { success, error } = useToast();
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getBackendUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await api.checkHealth(url.trim());
      if (ok) {
        setTestResult('success');
        success('Servidor online e respondendo com sucesso!');
      } else {
        setTestResult('fail');
        error('Não foi possível conectar ao servidor nessa URL.');
      }
    } catch {
      setTestResult('fail');
      error('Erro ao testar conexão.');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setCustomBackendUrl(url.trim());
    success('URL do servidor salva com sucesso!');
    onClose();
    window.location.reload();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuração do Servidor Backend"
      description="Defina ou altere a URL do servidor backend para conexão da API e WebRTC"
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-brand-400" />
            URL do Backend (Render / Railway / Túnel)
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setTestResult(null);
            }}
            placeholder="Ex: https://nexusvoice.onrender.com ou https://common-beers-occur.loca.lt"
            className="w-full px-3.5 py-2.5 bg-background-darkest border border-background-border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
          />
          <p className="text-[11px] text-slate-400">
            Deixe em branco para usar a rota relativa padrão da Vercel.
          </p>
        </div>

        {testResult === 'success' && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Servidor verificado e pronto para comunicação!</span>
          </div>
        )}

        {testResult === 'fail' && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>Servidor inacessível. Verifique se o backend está rodando.</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleTest}
            disabled={testing || !url.trim()}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />}
          >
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSave}>
              Salvar e Usar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
