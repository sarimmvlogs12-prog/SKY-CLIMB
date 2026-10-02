import { useEffect, useRef, useState } from "react";

/** Counts smoothly toward the target value. */
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const raf = useRef(0);
  const from = useRef(value);
  const start = useRef(0);

  useEffect(() => {
    from.current = display;
    start.current = performance.now();
    const dur = 420;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start.current) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from.current + (value - from.current) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{display.toLocaleString()}</span>;
}
