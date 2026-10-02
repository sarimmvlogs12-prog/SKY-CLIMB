import {
  QUESTION_BANK,
  type Question,
  type QuestionCategory,
  type QuestionDifficulty,
} from "./questionBank";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Serves non-repeating random questions for one game session. */
export class QuestionManager {
  private queue: Question[] = [];
  private used = new Set<string>();

  constructor(
    private categories: QuestionCategory[],
    private difficulty?: QuestionDifficulty,
  ) {
    this.refill();
  }

  private pool(): Question[] {
    const valid = this.categories.filter((c) =>
      QUESTION_BANK.some((q) => q.category === c),
    );
    let pool = QUESTION_BANK.filter((q) => !valid.length || valid.includes(q.category));
    const exact = pool.filter((q) => q.difficulty === this.difficulty);
    if (this.difficulty && exact.length >= 6) pool = exact;
    return pool.length ? pool : QUESTION_BANK;
  }

  private refill() {
    const fresh = this.pool().filter((q) => !this.used.has(q.id));
    this.queue = shuffle(fresh.length ? fresh : this.pool());
    if (!fresh.length) this.used.clear();
  }

  next(): Question {
    if (!this.queue.length) this.refill();
    const q = this.queue.pop()!;
    this.used.add(q.id);
    // Shuffle answer order every time so the correct letter keeps changing.
    const order = shuffle([0, 1, 2, 3]);
    return {
      ...q,
      options: order.map((i) => q.options[i]!) as Question["options"],
      correct: order.indexOf(q.correct) as Question["correct"],
    };
  }

  reset() {
    this.used.clear();
    this.refill();
  }
}
