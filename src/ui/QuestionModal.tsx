import { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "@/questions/questionBank";
import { audio } from "@/game/audio";

const LETTERS = ["A", "B", "C", "D"] as const;

export function QuestionModal({
  question,
  onResolved,
  streak,
}: {
  question: Question;
  onResolved: (correct: boolean, answerMs: number) => void;
  streak: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const started = useRef(performance.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    started.current = performance.now();
    setPicked(null);
    setElapsed(0);
  }, [question.id]);

  useEffect(() => {
    const id = window.setInterval(
      () => setElapsed(performance.now() - started.current),
      100,
    );
    return () => window.clearInterval(id);
  }, [question.id]);

  const fastWindow = useMemo(() => Math.max(0, 6000 - elapsed), [elapsed]);
  const isCorrect = picked !== null && picked === question.correct;

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ms = performance.now() - started.current;
    window.setTimeout(() => onResolved(i === question.correct, ms), 1500);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/65 p-3 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-2xl game-panel p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="ink-border rounded-full bg-grape px-3 py-1 font-display text-xs font-bold uppercase text-panel">
            {question.category}
          </span>
          <div className="flex items-center gap-2">
            <span className="ink-border rounded-full bg-sky-low px-3 py-1 text-xs font-bold text-ink">
              {question.difficulty}
            </span>
            <span className="ink-border rounded-full bg-streak/15 px-3 py-1 text-xs font-bold text-streak">
              🔥 Streak {streak}
            </span>
          </div>
        </div>

        <h2 className="mt-4 font-display text-2xl font-extrabold leading-snug text-ink sm:text-3xl">
          {question.question}
        </h2>

        {picked === null && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-low">
            <div
              className="h-full bg-energy transition-[width] duration-100"
              style={{ width: `${(fastWindow / 6000) * 100}%` }}
            />
          </div>
        )}
        {picked === null && (
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            {fastWindow > 0
              ? `Answer in ${(fastWindow / 1000).toFixed(1)}s for a speed bonus (+50 pts)`
              : "Speed bonus missed — still worth full energy!"}
          </p>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {question.options.map((opt, i) => {
            const revealed = picked !== null;
            const right = i === question.correct;
            const chosen = i === picked;
            let tone = "bg-panel text-ink";
            if (revealed && right) tone = "bg-flag text-ink";
            else if (revealed && chosen) tone = "bg-destructive text-panel";
            else if (revealed) tone = "bg-panel text-ink opacity-60";
            return (
              <button
                key={i}
                onClick={() => {
                  audio.play("click");
                  choose(i);
                }}
                disabled={revealed}
                className={`btn-pop flex items-center gap-3 px-4 py-3 text-left ${tone}`}
              >
                <span className="ink-border flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-low font-display text-sm font-extrabold text-ink">
                  {LETTERS[i]}
                </span>
                <span className="font-display text-base">{opt}</span>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div
            className={`animate-pop-in mt-4 rounded-2xl border-[3px] border-ink p-3 ${
              isCorrect ? "bg-flag/25" : "bg-destructive/15"
            }`}
          >
            <p className="font-display text-lg font-extrabold text-ink">
              {isCorrect ? "Correct! ⚡ Energy added" : "Not quite — streak reset"}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-soft">
              {isCorrect
                ? question.explanation
                : `Answer: ${LETTERS[question.correct]}) ${question.options[question.correct]} — ${question.explanation}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
