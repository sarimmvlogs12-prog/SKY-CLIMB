const STEPS = [
  {
    n: "1",
    title: "ANSWER",
    body: "Tap ANSWER QUESTION to pull up a quiz card. Correct answers earn ⚡ Energy, score and streak.",
    color: "bg-energy",
  },
  {
    n: "2",
    title: "CLIMB",
    body: "Every jump spends 100 ⚡ Energy. Use it wisely to hop, bounce and slide your way up the tower.",
    color: "bg-flag",
  },
  {
    n: "3",
    title: "FINISH",
    body: "The sky never ends! Climb as high as you can before time runs out. Checkpoints give +500⚡. Press jump again in mid-air to double jump (200⚡). A normal jump costs 100⚡.",
    color: "bg-grape",
  },
];

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/65 p-4 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-2xl game-panel p-5">
        <h2 className="font-display text-3xl font-extrabold text-ink">How to play</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border-[3px] border-ink bg-sky-low/50 p-3">
              <span
                className={`ink-border inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.color} font-display text-lg font-extrabold text-ink`}
              >
                {s.n}
              </span>
              <p className="mt-2 font-display text-xl font-extrabold text-ink">{s.title}</p>
              <p className="mt-1 text-sm font-semibold text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border-[3px] border-ink bg-panel p-3">
            <p className="font-display text-lg font-extrabold text-ink">Controls</p>
            <ul className="mt-1 space-y-1 text-sm font-semibold text-ink-soft">
              <li>
                <b className="text-ink">A / ←</b> move left
              </li>
              <li>
                <b className="text-ink">D / →</b> move right
              </li>
              <li>
                <b className="text-ink">Space / W / ↑</b> jump (costs 100 ⚡)
              </li>
              <li>
                <b className="text-ink">On mobile</b> use the on-screen buttons
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border-[3px] border-ink bg-panel p-3">
            <p className="font-display text-lg font-extrabold text-ink">Platforms</p>
            <ul className="mt-1 space-y-1 text-sm font-semibold text-ink-soft">
              <li>🟨 Bounce — launches you sky high</li>
              <li>🟦 Ice — slippery, ease into turns</li>
              <li>🟫 Breakable — crumbles if you linger</li>
              <li>🟪 Moving — ride it, then jump</li>
              <li>🟩 Checkpoint — saves your respawn +500 ⚡</li>
            </ul>
          </div>
        </div>

        <button onClick={onBack} className="btn-pop mt-5 w-full bg-flag px-6 py-3 text-lg text-ink">
          GOT IT
        </button>
      </div>
    </div>
  );
}
