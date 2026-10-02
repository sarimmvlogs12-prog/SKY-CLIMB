import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { audio } from "@/game/audio";
import { GameEngine } from "@/game/engine";
import type { EngineEvent, HudSnapshot, InputState } from "@/game/types";
import { QuestionManager } from "@/questions/questionManager";
import type { Question } from "@/questions/questionBank";
import {
  DEFAULT_SAVE,
  DEFAULT_SETTINGS,
  loadLeaderboard,
  loadSave,
  loadSettings,
  saveSave,
  saveSettings,
  submitScore,
  type GameSettings,
  type LeaderboardEntry,
  type SaveData,
} from "@/state/storage";
import { HUD } from "@/ui/HUD";
import { HowToPlay } from "@/ui/HowToPlay";
import { Leaderboard } from "@/ui/Leaderboard";
import { MainMenu } from "@/ui/MainMenu";
import { GameOverScreen, PauseOverlay, Toast } from "@/ui/Overlays";
import { QuestionModal } from "@/ui/QuestionModal";
import { SettingsPanel } from "@/ui/SettingsPanel";
import { TouchControls } from "@/ui/TouchControls";
import { VictoryScreen, type RunResult } from "@/ui/VictoryScreen";
import { LoginPage } from "@/ui/LoginPage";
import { MultiplayerLobby } from "@/ui/MultiplayerLobby";
import {
  createRoom,
  finishRoom,
  joinRoom,
  leaveRoom,
  loadPlayers,
  raceChannel,
  startRoom,
  watchRoom,
  type GhostPos,
  type Room,
  type RoomPlayer,
} from "@/state/multiplayer";
import { formatTime } from "@/state/storage";
import { shareOnTwitter } from "@/lib/share";
import { loadCloudLeaderboard, loadCloudProfile, saveCloudProfile, submitCloudResult } from "@/state/cloud";

type Screen = "menu" | "lobby" | "playing";
type Overlay =
  | "none"
  | "question"
  | "paused"
  | "settings"
  | "leaderboard"
  | "howto"
  | "victory"
  | "gameover"
  | "mpresult";

const EMPTY_HUD: HudSnapshot = {
  energy: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  timeLeftMs: 600_000,
  meters: 0,
  maxMeters: 0,
  finishMeters: 1000,
  checkpoint: 0,
  totalCheckpoints: 0,
  correct: 0,
  answered: 0,
  energyEarned: 0,
  level: 1,
  status: "playing",
};

export function SkyClimb() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const qmRef = useRef<QuestionManager | null>(null);
  const toastTimer = useRef(0);

  const [screen, setScreen] = useState<Screen>("menu");
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [level, setLevel] = useState(1);
  const [runKey, setRunKey] = useState(0);
  const [hud, setHud] = useState<HudSnapshot>(EMPTY_HUD);
  const [question, setQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(
    null,
  );
  const [energyHint, setEnergyHint] = useState(false);
  const [save, setSave] = useState<SaveData>(DEFAULT_SAVE);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [mode, setMode] = useState<"solo" | "multi">("solo");
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [mpBusy, setMpBusy] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);
  const [live, setLive] = useState<{ uid: string; name: string; m: number }[]>([]);
  const [isTop, setIsTop] = useState(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const screenRef = useRef<Screen>("menu");

  // hydrate persisted data on the client
  useEffect(() => {
    setSave(loadSave());
    setSettings(loadSettings());
    setBoard(loadLeaderboard());
    void loadCloudLeaderboard().then(setBoard).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    loadCloudProfile(user.id).then((profile) => {
      if (!profile) return;
      setSave((current) => {
        const next = { ...current, ...profile };
        saveSave(next);
        return next;
      });
    }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    audio.applySettings(settings);
    saveSettings(settings);
  }, [settings]);

  const showToast = useCallback((text: string, tone: "good" | "bad" | "info") => {
    setToast({ text, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1600);
  }, []);

  screenRef.current = screen;

  const finishRun = useCallback(
    (engine: GameEngine, victory: boolean) => {
      const s = engine.snapshot;
      const accuracy = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
      const run: RunResult = {
        height: s.maxMeters,
        score: s.score,
        correct: s.correct,
        answered: s.answered,
        energyEarned: s.energyEarned,
        bestStreak: s.bestStreak,
        timeMs: engine.elapsedMs,
        level: s.level,
      };
      setResult(run);
      const next: SaveData = {
        ...save,
        highScore: Math.max(save.highScore, s.score),
        bestHeight: Math.max(save.bestHeight, s.maxMeters),
        bestAccuracy: Math.max(save.bestAccuracy, accuracy),
        bestStreak: Math.max(save.bestStreak, s.bestStreak),
        completedLevels: victory
          ? Array.from(new Set([...save.completedLevels, s.level]))
          : save.completedLevels,
      };
      setSave(next);
      saveSave(next);
      if (user) void saveCloudProfile(user.id, next).catch(() => undefined);
      const entry: LeaderboardEntry = {
        ...(user ? { userId: user.id } : {}),
        name: save.playerName || "Climber",
        score: s.score,
        height: s.maxMeters,
        accuracy,
        timeMs: engine.elapsedMs,
      };
      if (modeRef.current === "multi") {
        if (victory && room) {
          void finishRoom(room.id, engine.elapsedMs)
            .then(setRoom)
            .catch(() => undefined)
            .finally(() => setOverlay("mpresult"));
        }
        return;
      }
      setBoard(submitScore(entry));
      if (victory && user) {
        void submitCloudResult(user.id, { ...entry, bestStreak: s.bestStreak })
          .then(loadCloudLeaderboard)
          .then((b) => {
            setBoard(b);
            setIsTop(b[0]?.userId === user.id && Math.round(b[0].timeMs) === Math.max(1, Math.round(engine.elapsedMs)));
          })
          .catch(() => showToast("Run saved on this device", "info"));
      }
    },
    [save, showToast, user, room],
  );

  const handleEvent = useCallback(
    (e: EngineEvent) => {
      const engine = engineRef.current;
      switch (e.type) {
        case "fell":
          showToast("Oops! Back on your last platform", "bad");
          break;
        case "checkpoint":
          showToast(`CHECKPOINT ${e.index} REACHED! +15⚡`, "good");
          break;
        case "milestone":
          showToast(`${e.meters}m REACHED! +500 · +10⚡`, "good");
          break;
        case "noEnergy":
          if (!energyHint) {
            setEnergyHint(true);
            showToast("Out of energy — answer a question!", "info");
            window.setTimeout(() => setEnergyHint(false), 1200);
          }
          break;
        case "victory":
          if (engine) finishRun(engine, true);
          if (modeRef.current === "solo") setOverlay("victory");
          break;
        case "timeup":
          if (engine) finishRun(engine, false);
          setOverlay("gameover");
          break;
        default:
          break;
      }
    },
    [energyHint, finishRun, showToast],
  );

  // create / destroy the engine for each run
  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    qmRef.current = new QuestionManager([]);
    const engine = new GameEngine({
      canvas,
      level,
      difficulty: "normal",
      playerName: save.playerName || "Climber",
      skin: save.skin,
      multiplayer: modeRef.current === "multi",
      onHud: setHud,
      onEvent: handleEvent,
    });
    engineRef.current = engine;
    engine.start();
    audio.unlock();
    if (settings.sound && settings.music) audio.startMusic();

    return () => {
      engine.destroy();
      engineRef.current = null;
      audio.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, runKey, level]);

  // keep engine status in sync with overlays
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (overlay === "none") engine.setStatus("playing");
    else if (overlay === "question") engine.setStatus("question");
    else engine.setStatus("paused");
  }, [overlay, hud.status]);

  // Escape toggles pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || screen !== "playing") return;
      setOverlay((o) => (o === "none" ? "paused" : o === "paused" ? "none" : o));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen]);

  // ----- multiplayer: room sync -----
  const roomId = room?.id;
  useEffect(() => {
    if (!roomId) return;
    void loadPlayers(roomId).then(setPlayers);
    return watchRoom(roomId, (r) => setRoom(r), setPlayers);
  }, [roomId]);

  const roomStatus = room?.status;
  useEffect(() => {
    if (!room || mode !== "multi") return;
    if (room.status === "playing" && screenRef.current === "lobby") {
      startRun(1); // everyone races the same tested course
    } else if (room.status === "finished" && screenRef.current === "playing" && room.winner_id !== user?.id) {
      setOverlay("mpresult");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomStatus, roomId, mode]);

  // ----- multiplayer: live positions -----
  useEffect(() => {
    if (screen !== "playing" || mode !== "multi" || !roomId || !user) return;
    const ghosts = new Map<string, GhostPos>();
    const ch = raceChannel(roomId, (p) => ghosts.set(p.uid, p));
    let tick = 0;
    let seq = 0;
    let lastKey = "";
    let previous = { ...engineRef.current?.position, sampledAt: performance.now() };
    let frame = 0;
    let lastSent = 0;
    let lastBoard = 0;
    const loop = (nowFrame: number) => {
      frame = window.requestAnimationFrame(loop);
      if (nowFrame - lastSent < 50) return;
      lastSent = nowFrame;
      const engine = engineRef.current;
      if (!engine) return;
      const pos = engine.position;
      const sampledAt = performance.now();
      const sampleDt = previous.x === undefined ? 0 : Math.max(0.001, (sampledAt - previous.sampledAt) / 1000);
      const vx = previous.x === undefined ? 0 : (pos.x - previous.x) / sampleDt;
      const vy = previous.y === undefined ? 0 : (pos.y - previous.y) / sampleDt;
      previous = { ...pos, sampledAt };
      const key = `${Math.round(pos.x)},${Math.round(pos.y)},${pos.f}`;
      // Send moving racers at 20Hz for responsive cross-device ghosts; idle racers
      // still send only a lightweight heartbeat once per second.
      if (key !== lastKey || tick % 20 === 0) {
        lastKey = key;
        ch.send({
          uid: user.id,
          name: save.playerName || "Climber",
          look: save.skin.look,
          ...pos,
          vx,
          vy,
          seq: seq++,
          sentAt: Date.now(),
        });
      }
      const now = Date.now();
      for (const [k, g] of ghosts) if (now - g.at > 4000) ghosts.delete(k);
      engine.setGhosts([...ghosts.values()]);
      tick++;
      if (nowFrame - lastBoard >= 250) {
        lastBoard = nowFrame;
        setLive(
          [
            { uid: user.id, name: save.playerName || "Climber", m: engine.snapshot.maxMeters },
            ...[...ghosts.values()].map((g) => ({ uid: g.uid, name: g.name, m: g.m })),
          ].sort((a, b) => b.m - a.m),
        );
      }
    };
    frame = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(frame);
      ch.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, mode, roomId, user, runKey]);

  const exitMultiplayer = () => {
    if (room && user) void leaveRoom(room.id, user.id);
    setRoom(null);
    setPlayers([]);
    setMpError(null);
    setMode("solo");
    setOverlay("none");
    setScreen("menu");
  };

  const mpAction = async (fn: () => Promise<Room | void>) => {
    setMpBusy(true);
    setMpError(null);
    try {
      const r = await fn();
      if (r) setRoom(r);
    } catch (e) {
      setMpError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setMpBusy(false);
    }
  };

  const startRun = (lvl = level) => {
    audio.play("click");
    setLevel(lvl);
    setRunKey((k) => k + 1);
    setResult(null);
    setIsTop(false);
    setOverlay("none");
    setScreen("playing");
  };

  const openQuestion = () => {
    if (!qmRef.current) return;
    audio.play("click");
    setQuestion(qmRef.current.next());
    setOverlay("question");
  };

  const resolveQuestion = (correct: boolean, answerMs: number) => {
    const engine = engineRef.current;
    if (engine) {
      const out = engine.recordAnswer(correct, answerMs);
      if (correct) {
        showToast(
          out.milestone
            ? `🔥 STREAK ${out.streak}! +${out.energyGained}⚡`
            : `+${out.energyGained}⚡  +${out.scoreGained} pts`,
          "good",
        );
      }
    }
    setOverlay("none");
    setQuestion(null);
  };

  const touchInput = (next: Partial<InputState>) => engineRef.current?.setTouchInput(next);

  const showTouch = settings.controls === "touch";
  const menuBest = useMemo(
    () => ({
      highScore: save.highScore,
      bestHeight: save.bestHeight,
      bestStreak: save.bestStreak,
    }),
    [save],
  );

  if (!authReady) {
    return <div className="grid h-[100dvh] place-items-center bg-sky-mid font-display text-xl font-bold text-ink">Loading DLICOM Sky Climb…</div>;
  }
  if (!user) return <LoginPage />;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-ink font-body select-none">
      {screen === "menu" ? (
        <MainMenu
          playerName={save.playerName}
          skin={save.skin}
          onSkinChange={(skin) => {
            const next = { ...save, skin };
            setSave(next);
            saveSave(next);
            void saveCloudProfile(user.id, next);
          }}
          onNameChange={(n) => {
            const next = { ...save, playerName: n };
            setSave(next);
            saveSave(next);
            void saveCloudProfile(user.id, next);
          }}
          onPlay={() => {
            setMode("solo");
            startRun(1);
          }}
          onMultiplayer={() => {
            audio.play("click");
            setMode("multi");
            setMpError(null);
            setScreen("lobby");
          }}
          onHowTo={() => {
            audio.play("click");
            setOverlay("howto");
          }}
          onLeaderboard={() => {
            audio.play("click");
            void loadCloudLeaderboard().then(setBoard).catch(() => setBoard(loadLeaderboard()));
            setOverlay("leaderboard");
          }}
          onSettings={() => {
            audio.play("click");
            setOverlay("settings");
          }}
          onSignOut={async () => {
            await supabase.auth.signOut();
            setOverlay("none");
            setScreen("menu");
          }}
          best={menuBest}
          topBoard={board}
        />
      ) : screen === "lobby" ? (
        <MultiplayerLobby
          room={room}
          players={players}
          userId={user.id}
          busy={mpBusy}
          error={mpError}
          onHost={() => void mpAction(() => createRoom(save.playerName || "Climber", save.skin.look))}
          onJoin={(code) => void mpAction(() => joinRoom(code, save.playerName || "Climber", save.skin.look))}
          onStart={() => room && void mpAction(() => startRoom(room.id))}
          onLeave={exitMultiplayer}
        />
      ) : (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          <HUD
            hud={hud}
            playerName={save.playerName}
            energyHint={energyHint}
            onPause={() => {
              audio.play("click");
              setOverlay("paused");
            }}
            onSettings={() => {
              audio.play("click");
              setOverlay("settings");
            }}
            onAnswer={openQuestion}
          />
          {mode === "multi" && live.length > 0 && (
            <div className="pointer-events-none absolute left-2 top-20 z-20 w-36 rounded-xl border-[3px] border-ink bg-panel/90 p-2 shadow-panel backdrop-blur-sm sm:left-4 sm:top-24 sm:w-52 sm:p-3">
              <p className="font-display text-xs font-extrabold text-ink sm:text-sm">🏁 LIVE RACE</p>
              <ol className="mt-1 grid gap-0.5">
                {live.map((p, i) => (
                  <li key={p.uid} className={`flex justify-between gap-1 rounded px-1 font-display text-[11px] text-ink sm:px-2 sm:py-0.5 sm:text-sm ${p.uid === user.id ? "bg-energy/60" : ""}`}>
                    <span className="truncate">{i + 1}. {p.name}</span>
                    <span className="tabular-nums">{Math.round(p.m)}m</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {overlay === "none" && (
            <TouchControls onInput={touchInput} forceVisible={showTouch} />
          )}
        </>
      )}

      {toast && <Toast text={toast.text} tone={toast.tone} />}

      {overlay === "question" && question && (
        <QuestionModal
          question={question}
          streak={hud.streak}
          onResolved={resolveQuestion}
        />
      )}

      {overlay === "paused" && (
        <PauseOverlay
          onResume={() => {
            audio.play("click");
            setOverlay("none");
          }}
          onRestart={() => startRun(level)}
          onMenu={() => {
            audio.play("click");
            if (mode === "multi") return exitMultiplayer();
            setOverlay("none");
            setScreen("menu");
          }}
        />
      )}

      {overlay === "settings" && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onBack={() => {
            audio.play("click");
            setOverlay("none");
          }}
        />
      )}

      {overlay === "leaderboard" && (
        <Leaderboard
          entries={board}
          playerName={save.playerName}
          onBack={() => {
            audio.play("click");
            setOverlay(result ? "victory" : "none");
          }}
        />
      )}

      {overlay === "howto" && (
        <HowToPlay
          onBack={() => {
            audio.play("click");
            setOverlay("none");
          }}
        />
      )}

      {overlay === "victory" && result && (
        <VictoryScreen
          result={result}
          isTop={isTop}
          onShare={() => void shareOnTwitter(save.playerName || "Climber", result.timeMs, result.score)}
          onPlayAgain={() => startRun(level)}
          onNextLevel={() => startRun(level + 1)}
          onLeaderboard={() => {
            void loadCloudLeaderboard().then(setBoard).catch(() => setBoard(loadLeaderboard()));
            setOverlay("leaderboard");
          }}
          onMenu={() => {
            setOverlay("none");
            setScreen("menu");
          }}
        />
      )}

      {overlay === "mpresult" && room && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
          <div className="animate-pop-in w-full max-w-sm game-panel p-5 text-center">
            <p className="text-5xl">🏆</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink">
              {room.winner_id === user.id ? "YOU WIN!" : `${room.winner_name ?? "Someone"} WINS!`}
            </p>
            <p className="mt-1 font-display text-lg text-ink-soft">
              {room.winner_name ?? "Winner"} reached the summit first
              {room.winner_time_ms != null ? ` in ${formatTime(room.winner_time_ms)}` : ""}.
            </p>
            <ul className="mt-3 grid gap-1 text-left">
              {[...players]
                .sort((a, b) => (a.finish_time_ms ?? 9e12) - (b.finish_time_ms ?? 9e12))
                .map((p, i) => (
                  <li key={p.user_id} className="flex justify-between rounded-lg bg-sky-low/60 px-3 py-1 font-display text-sm text-ink">
                    <span className="truncate">{i + 1}. {p.player_name}</span>
                    <span>{p.finish_time_ms != null ? formatTime(p.finish_time_ms) : "—"}</span>
                  </li>
                ))}
            </ul>
            <button onClick={exitMultiplayer} className="btn-pop mt-4 w-full bg-flag px-6 py-3 text-lg text-ink">
              BACK TO MENU
            </button>
          </div>
        </div>
      )}

      {overlay === "gameover" && (
        <GameOverScreen
          height={hud.maxMeters}
          score={hud.score}
          onRetry={() => (mode === "multi" ? exitMultiplayer() : startRun(level))}
          onContinue={() => {
            audio.play("click");
            engineRef.current?.continueFromCheckpoint();
            setOverlay("none");
          }}
          onMenu={() => {
            setOverlay("none");
            setScreen("menu");
          }}
        />
      )}
    </div>
  );
}
