import { CHARACTERS } from "@/game/skins";
import type { CharacterSkin } from "@/game/types";

export function CharacterPicker({
  skin,
  onChange,
}: {
  skin: CharacterSkin;
  onChange: (s: CharacterSkin) => void;
}) {
  return (
    <div className="mt-3 rounded-2xl border-[3px] border-ink bg-sky-low/60 p-2.5 text-left">
      <p className="font-display text-xs font-bold uppercase text-ink-soft">Choose character</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {CHARACTERS.map((character) => (
          <button
            key={character.id}
            title={character.name}
            aria-label={`Character ${character.name}`}
            aria-pressed={skin.look === character.id}
            onClick={() => onChange({ look: character.id })}
            className={`min-w-0 rounded-xl border-[3px] p-1 transition-transform hover:-translate-y-0.5 ${
              skin.look === character.id ? "border-ink bg-energy" : "border-ink/60 bg-panel"
            }`}
          >
            <span className="flex h-16 items-center justify-center overflow-hidden rounded-lg bg-sky-low/40">
              <img className="h-full w-full object-contain" src={character.src} alt="" />
            </span>
            <span className="mt-1 block truncate font-display text-[10px] font-extrabold uppercase text-ink">
              {character.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
