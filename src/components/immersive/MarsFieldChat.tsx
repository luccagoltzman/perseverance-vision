import { useEffect, useRef } from 'react';
import type { FieldChatMessage } from '@/types/multiplayer';

interface MarsFieldChatProps {
  open: boolean;
  onToggle: () => void;
  messages: FieldChatMessage[];
  playerName: string;
  onlineCount: number;
  onSend: (text: string) => void;
}

export function MarsFieldChat({
  open,
  onToggle,
  messages,
  playerName,
  onlineCount,
  onSend,
}: MarsFieldChatProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) draftRef.current?.focus();
  }, [open]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draftRef.current?.value.trim() ?? '';
    if (!text) return;
    onSend(text);
    if (draftRef.current) draftRef.current.value = '';
  };

  return (
    <div className="absolute right-4 top-20 z-20 flex flex-col items-end gap-2 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2">
        <span className="text-[10px] font-mono text-zinc-400 bg-black/40 backdrop-blur px-2 py-1 rounded-full border border-white/10">
          {onlineCount} online
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-full bg-black/45 hover:bg-black/60 text-white border border-white/20 backdrop-blur transition-colors"
        >
          {open ? 'Fechar chat' : 'Chat (Enter)'}
        </button>
      </div>

      {open && (
        <div className="pointer-events-auto w-[min(100vw-2rem,320px)] rounded-xl bg-black/75 backdrop-blur-md border border-white/15 shadow-xl overflow-hidden flex flex-col max-h-[40vh]">
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px]">
            {messages.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Nenhuma mensagem ainda. Diga olá!</p>
            ) : (
              messages.map((msg) => (
                <div key={`${msg.ts}-${msg.id}`} className="text-xs leading-relaxed">
                  <span
                    className={
                      msg.name === playerName
                        ? 'text-mars-300 font-medium'
                        : 'text-zinc-300 font-medium'
                    }
                  >
                    {msg.name}:
                  </span>{' '}
                  <span className="text-zinc-100">{msg.text}</span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={send} className="border-t border-white/10 p-2 flex gap-2">
            <input
              ref={draftRef}
              type="text"
              maxLength={160}
              placeholder="Mensagem…"
              className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-mars-400/50"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-mars-600 hover:bg-mars-500 text-white text-xs font-medium"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
