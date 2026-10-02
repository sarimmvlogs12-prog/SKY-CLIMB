import type { GameSettings } from "@/state/storage";

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl border-[3px] border-ink bg-panel px-3 py-2"
    >
      <span className="font-display text-base text-ink">{label}</span>
      <span
        className={`ink-border rounded-full px-3 py-0.5 font-display text-xs font-extrabold ${
          value ? "bg-flag text-ink" : "bg-sky-low text-ink-soft"
        }`}
      >
        {value ? "ON" : "OFF"}
      </span>
    </button>
  );
}

export function SettingsPanel({
  settings,
  onChange,
  onBack,
}: {
  settings: GameSettings;
  onChange: (s: GameSettings) => void;
  onBack: () => void;
}) {

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/65 p-4 backdrop-blur-sm">
      <div className="animate-pop-in max-h-full w-full max-w-xl overflow-y-auto game-panel p-5">
        <h2 className="font-display text-3xl font-extrabold text-ink">⚙ Settings</h2>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Toggle
            label="Sound"
            value={settings.sound}
            onChange={(v) => onChange({ ...settings, sound: v })}
          />
          <Toggle
            label="Music"
            value={settings.music}
            onChange={(v) => onChange({ ...settings, music: v })}
          />
          <Toggle
            label="SFX"
            value={settings.sfx}
            onChange={(v) => onChange({ ...settings, sfx: v })}
          />
        </div>


        <p className="mt-4 font-display text-sm font-bold uppercase text-ink-soft">Controls</p>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(["keyboard", "touch"] as const).map((c) => (
            <button
              key={c}
              onClick={() => onChange({ ...settings, controls: c })}
              className={`btn-pop px-2 py-2 text-sm capitalize ${
                settings.controls === c ? "bg-flag text-ink" : "bg-panel text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onBack}
            className="btn-pop flex-1 bg-flag px-6 py-3 text-lg text-ink"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}
