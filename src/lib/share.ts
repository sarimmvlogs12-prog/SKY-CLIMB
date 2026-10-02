import { formatTime } from "@/state/storage";

/** Draws a shareable score card and returns it as a PNG blob. */
export async function makeScoreCard(name: string, timeMs: number, score: number): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 675;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 675);
  grad.addColorStop(0, "#5fb8f5");
  grad.addColorStop(1, "#c9ecff");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1200, 675);
  g.fillStyle = "#20304a";
  g.textAlign = "center";
  g.font = "bold 96px sans-serif";
  g.fillText("DLICOM SKY CLIMB", 600, 150);
  g.font = "bold 60px sans-serif";
  g.fillText("🏆 #1 ON THE LEADERBOARD", 600, 270);
  g.font = "bold 72px sans-serif";
  g.fillText(name, 600, 390);
  g.font = "bold 64px sans-serif";
  g.fillText(`⏱ ${formatTime(timeMs)}   ·   ${score.toLocaleString()} pts`, 600, 500);
  g.font = "bold 36px sans-serif";
  g.fillText("Answer. Climb. Conquer.", 600, 610);
  return new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
}

export async function shareOnTwitter(name: string, timeMs: number, score: number) {
  const text = `I'm #1 on DLICOM Sky Climb! 🏆 Reached the summit in ${formatTime(timeMs)} with ${score.toLocaleString()} points. Can you beat me?`;
  const url = window.location.origin;
  const blob = await makeScoreCard(name, timeMs, score);
  const file = new File([blob], "sky-climb-score.png", { type: "image/png" });
  // Phones: native share sheet attaches the image directly to the X post.
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `${text} ${url}` });
      return;
    } catch {
      /* cancelled – fall through */
    }
  }
  // Desktop: download the image, then open the X composer to attach it.
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sky-climb-score.png";
  a.click();
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    "_blank",
    "noopener",
  );
}
