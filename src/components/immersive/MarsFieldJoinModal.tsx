import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { MarsFieldMultiplayerClient, getStoredFieldName, storeFieldName } from '@/services/marsFieldMultiplayer';

interface MarsFieldJoinModalProps {
  open: boolean;
  onClose: () => void;
  onJoin: (name: string, client: MarsFieldMultiplayerClient) => void;
}

export function MarsFieldJoinModal({ open, onClose, onJoin }: MarsFieldJoinModalProps) {
  const [name, setName] = useState(getStoredFieldName);
  const [online, setOnline] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(getStoredFieldName());

    const peek = new MarsFieldMultiplayerClient();
    peek
      .peekOnlineCount()
      .then((count) => setOnline(count))
      .catch(() => setOnline(null));
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Digite um nome com pelo menos 2 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    storeFieldName(trimmed);

    const client = new MarsFieldMultiplayerClient();
    try {
      await client.connect(trimmed);
      onJoin(trimmed, client);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar na sala.');
      client.disconnect();
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Entrar no campo multiplayer"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface-elevated dark:bg-space-900 border border-border shadow-2xl p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-mars-600 dark:text-mars-400">
            Multiplayer · Elysium Planitia
          </p>
          <h2 className="font-display text-2xl text-content dark:text-white mt-2 tracking-wide">
            Entrar no campo
          </h2>
          <p className="text-sm text-content-muted dark:text-slate-400 mt-2 leading-relaxed">
            Sem cadastro — escolha um apelido e explore o mundo 3D com outras pessoas em tempo real.
          </p>
          {online !== null && (
            <p className="text-xs text-mars-700 dark:text-mars-300 mt-3 font-medium">
              {online === 0
                ? 'Nenhum explorador online agora — seja o primeiro!'
                : `${online} explorador${online === 1 ? '' : 'es'} online agora`}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="field-name" className="text-xs text-content-subtle uppercase tracking-wider font-medium">
              Seu nome
            </label>
            <input
              id="field-name"
              type="text"
              maxLength={20}
              autoComplete="nickname"
              autoFocus
              placeholder="Ex: Alex, Stardust…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field mt-1.5 w-full"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Conectando…' : 'Entrar no mundo'}
            </Button>
          </div>
        </form>

        <p className="text-[10px] text-content-subtle leading-relaxed">
          Ao entrar, outros jogadores verão seu nome e posição no campo. Use o chat para conversar.
        </p>
      </div>
    </div>,
    document.body,
  );
}
