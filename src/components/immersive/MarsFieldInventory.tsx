interface MarsFieldInventoryProps {
  open: boolean;
  onClose: () => void;
  laserEquipped: boolean;
  alive: boolean;
  onEquip: () => void;
  onStow: () => void;
}

export function MarsFieldInventory({
  open,
  onClose,
  laserEquipped,
  alive,
  onEquip,
  onStow,
}: MarsFieldInventoryProps) {
  if (!open) return null;

  return (
    <div className="absolute left-4 top-20 z-[25] flex flex-col items-start gap-2 pointer-events-none">
      <div className="pointer-events-auto w-[min(100vw-2rem,280px)] rounded-xl bg-black/80 backdrop-blur-md border border-white/15 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <p className="text-xs font-mono uppercase tracking-wider text-mars-300">Inventário</p>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-sm px-2"
            aria-label="Fechar inventário"
          >
            ✕
          </button>
        </div>
        <div className="p-3">
          <div
            className={`rounded-lg border p-3 flex gap-3 items-center ${
              laserEquipped ? 'border-mars-500/60 bg-mars-600/15' : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/30 to-mars-600/30 border border-cyan-400/30 flex items-center justify-center text-lg">
              ⚡
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Rifle Laser</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {laserEquipped ? 'Equipado · Q para atirar' : 'No inventário'}
              </p>
            </div>
            {alive && (
              <button
                type="button"
                onClick={laserEquipped ? onStow : onEquip}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-mars-600 hover:bg-mars-500 text-white shrink-0"
              >
                {laserEquipped ? 'Guardar' : 'Equipar'}
              </button>
            )}
          </div>
          {!alive && (
            <p className="text-[10px] text-zinc-500 mt-2 text-center">
              Você está eliminado — aguarde o respawn.
            </p>
          )}
        </div>
        <p className="text-[10px] font-mono text-zinc-500 px-3 pb-2 text-center">I · fechar inventário</p>
      </div>
    </div>
  );
}
