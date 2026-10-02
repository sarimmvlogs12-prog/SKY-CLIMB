import type { InputState } from "@/game/types";

export function TouchControls({
  onInput,
  forceVisible = false,
}: {
  onInput: (next: Partial<InputState>) => void;
  forceVisible?: boolean;
}) {
  const hold = (next: Partial<InputState>, release: Partial<InputState>) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      onInput(next);
    },
    onPointerUp: () => onInput(release),
    onPointerCancel: () => onInput(release),
    onLostPointerCapture: () => onInput(release),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const base =
    "btn-pop pointer-events-auto flex h-16 w-16 select-none items-center justify-center bg-panel/95 font-display text-2xl text-ink touch-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]";

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 items-end justify-between px-3 sm:px-4 ${
        forceVisible ? "flex" : "hidden max-sm:flex pointer-coarse:flex"
      }`}
    >
      <div className="pointer-events-none flex gap-2">
        <button aria-label="Move left" className={base} {...hold({ left: true }, { left: false })}>
          ◀
        </button>
        <button aria-label="Move right" className={base} {...hold({ right: true }, { right: false })}>
          ▶
        </button>
      </div>
      <button
        aria-label="Jump"
        className={`${base} h-20 w-20 bg-flag text-base`}
        {...hold({ jump: true }, { jump: false })}
      >
        JUMP
      </button>
    </div>
  );
}
