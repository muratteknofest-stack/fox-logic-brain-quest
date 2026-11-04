import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  HelpCircle,
  Award,
  ChevronRight,
  ArrowLeft,
  Lock,
  Star,
  ExternalLink,
  Github,
  Zap,
  CheckCircle2,
  AlertCircle,
  Download,
  Flame,
  Brain,
} from 'lucide-react';
import { poki } from './poki/pokiBridge';
import {
  PokiLevel,
  ALL_POKI_LEVELS,
  GameCard,
  GameOption,
} from './poki/levelsData';

type GameScreen = 'TITLE' | 'MAP' | 'PLAYING' | 'VICTORY' | 'GAME_OVER';

interface LevelProgress {
  unlocked: boolean;
  stars: number; // 0 to 3
  bestTimeSec: number;
}

const STORAGE_KEY = 'fox_logic_progress_v2';

export const FoxLogicPokiGame: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [progress, setProgress] = useState<Record<number, LevelProgress>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    const initial: Record<number, LevelProgress> = {};
    for (let i = 1; i <= 50; i++) {
      initial[i] = {
        unlocked: i === 1,
        stars: 0,
        bestTimeSec: 999,
      };
    }
    return initial;
  });

  // Gameplay state
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isWrongShake, setIsWrongShake] = useState<boolean>(false);
  const [adMessage, setAdMessage] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthetic retro audio FX
  const playSound = (type: 'click' | 'correct' | 'wrong' | 'hint' | 'fanfare' | 'combo') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'combo') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        osc.frequency.setValueAtTime(1046.5, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'hint') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'fanfare') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.15);
        osc.frequency.setValueAtTime(659.25, now + 0.3);
        osc.frequency.setValueAtTime(880, now + 0.45);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch {}
  };

  // Init Poki SDK on mount
  useEffect(() => {
    void poki.init().then(() => {
      poki.gameLoadingFinished();
    });
  }, []);

  // Save progress
  const saveProgressState = (newProg: Record<number, LevelProgress>) => {
    setProgress(newProg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProg));
    } catch {}
  };

  // Timer loop during playing
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          poki.gameplayStop();
          setStreakCount(0);
          playSound('wrong');
          setScreen('GAME_OVER');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screen]);

  const currentLevel = ALL_POKI_LEVELS[currentLevelId - 1] || ALL_POKI_LEVELS[0];

  const handleStartLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setTimeLeft(levelId >= 31 ? 75 : 60); // More time for advanced 3x3 Raven matrices
    setEliminatedOptions([]);
    setHintUsed(false);
    setSelectedOptionId(null);
    setIsWrongShake(false);
    playSound('click');
    setScreen('PLAYING');
    poki.gameplayStart();
  };

  const handleSelectOption = (optId: string) => {
    if (selectedOptionId || screen !== 'PLAYING') return;
    setSelectedOptionId(optId);

    if (optId === currentLevel.correctId) {
      // Correct!
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      if (newStreak >= 2) {
        playSound('combo');
      } else {
        playSound('correct');
      }
      poki.gameplayStop();

      const timeSpent = (currentLevelId >= 31 ? 75 : 60) - timeLeft;
      let stars = 1;
      if (timeSpent < 20 && !hintUsed) stars = 3;
      else if (timeSpent < 45) stars = 2;

      const nextProg = { ...progress };
      const currentStars = nextProg[currentLevelId]?.stars || 0;
      nextProg[currentLevelId] = {
        unlocked: true,
        stars: Math.max(currentStars, stars),
        bestTimeSec: Math.min(nextProg[currentLevelId]?.bestTimeSec || 999, timeSpent),
      };
      if (currentLevelId < 50) {
        nextProg[currentLevelId + 1] = {
          ...nextProg[currentLevelId + 1],
          unlocked: true,
        };
      }
      saveProgressState(nextProg);

      setTimeout(() => {
        setScreen('VICTORY');
        playSound('fanfare');
        // Poki Commercial Break
        void poki.commercialBreak();
      }, 500);
    } else {
      // Wrong!
      playSound('wrong');
      setStreakCount(0);
      setIsWrongShake(true);
      setTimeout(() => {
        setIsWrongShake(false);
        setSelectedOptionId(null);
      }, 600);
    }
  };

  const handleUseHint = async () => {
    if (hintUsed || screen !== 'PLAYING') return;
    setAdMessage('Poki Ödüllü Video Reklamı Gösteriliyor (2 Yanlış Şık Elenecek)…');
    const granted = await poki.rewardedBreak();
    setAdMessage(null);

    if (granted) {
      playSound('hint');
      setHintUsed(true);
      // Eliminate 2 wrong options
      const wrongOpts = currentLevel.options
        .filter((o) => o.id !== currentLevel.correctId)
        .map((o) => o.id);
      const toEliminate = wrongOpts.slice(0, 2);
      setEliminatedOptions(toEliminate);
    }
  };

  const handleNextLevel = () => {
    if (currentLevelId < 50) {
      handleStartLevel(currentLevelId + 1);
    } else {
      setScreen('MAP');
    }
  };

  // Total stars counter & estimated IQ rating
  const totalStars = Object.values(progress).reduce((acc, p) => acc + p.stars, 0);
  const estimatedIQ = Math.min(160, 95 + Math.round(totalStars * 0.43));

  // Render geometric shapes inside cards (with compound nested shapes and inner dots)
  const renderCardShape = (card: GameCard | GameOption | null, isSmall = false) => {
    if (!card) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-amber-400 animate-pulse">?</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Solve</span>
        </div>
      );
    }

    const { shape, innerShape, innerDot, count, color, innerColor, rotation, filled } = card;
    const baseSize = isSmall ? 22 : 30;

    const renderSingleShape = (key: number) => {
      const transformStyle: React.CSSProperties = {
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.3s ease',
      };

      return (
        <div key={key} style={transformStyle} className="relative flex items-center justify-center">
          {/* Outer Main Shape */}
          {shape === 'star' && (
            <svg style={{ width: baseSize, height: baseSize }} viewBox="0 0 24 24">
              <polygon
                points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"
                fill={filled ? color : 'none'}
                stroke={color}
                strokeWidth="2.5"
              />
            </svg>
          )}
          {shape === 'circle' && (
            <svg style={{ width: baseSize, height: baseSize }} viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="9.5"
                fill={filled ? color : 'none'}
                stroke={color}
                strokeWidth="2.5"
              />
            </svg>
          )}
          {shape === 'triangle' && (
            <svg style={{ width: baseSize, height: baseSize }} viewBox="0 0 24 24">
              <polygon
                points="12,3 22,21 2,21"
                fill={filled ? color : 'none'}
                stroke={color}
                strokeWidth="2.5"
              />
            </svg>
          )}
          {shape === 'diamond' && (
            <svg style={{ width: baseSize, height: baseSize }} viewBox="0 0 24 24">
              <polygon
                points="12,2 22,12 12,22 2,12"
                fill={filled ? color : 'none'}
                stroke={color}
                strokeWidth="2.5"
              />
            </svg>
          )}
          {shape === 'pentagon' && (
            <svg style={{ width: baseSize, height: baseSize }} viewBox="0 0 24 24">
              <polygon
                points="12,2 22,9 18,21 6,21 2,9"
                fill={filled ? color : 'none'}
                stroke={color}
                strokeWidth="2.5"
              />
            </svg>
          )}
          {shape === 'hexagon' && (
            <svg style={{ width: baseSize, height: baseSize }} viewBox="0 0 24 24">
              <polygon
                points="12,2 21,7 21,17 12,22 3,17 3,7"
                fill={filled ? color : 'none'}
                stroke={color}
                strokeWidth="2.5"
              />
            </svg>
          )}
          {shape === 'arrow' && (
            <svg style={{ width: baseSize, height: baseSize }} viewBox="0 0 24 24">
              <polygon
                points="12,2 21,10 16,10 16,22 8,22 8,10 3,10"
                fill={filled ? color : 'none'}
                stroke={color}
                strokeWidth="2.5"
              />
            </svg>
          )}
          {shape === 'square' && (
            <svg style={{ width: baseSize, height: baseSize }} viewBox="0 0 24 24">
              <rect
                x="3.5"
                y="3.5"
                width="17"
                height="17"
                rx="3"
                fill={filled ? color : 'none'}
                stroke={color}
                strokeWidth="2.5"
              />
            </svg>
          )}

          {/* Nested Inner Shape / Dot */}
          {innerShape === 'circle' && (
            <div
              className="absolute w-2.5 h-2.5 rounded-full border border-white"
              style={{ backgroundColor: innerColor || '#FFFFFF' }}
            />
          )}
          {innerShape === 'diamond' && (
            <div
              className="absolute w-2.5 h-2.5 rotate-45 border border-white"
              style={{ backgroundColor: innerColor || '#FFFFFF' }}
            />
          )}
          {innerShape === 'cross' && (
            <div className="absolute text-[11px] font-black leading-none text-white">
              +
            </div>
          )}
          {innerDot && (
            <div className="absolute w-2 h-2 rounded-full bg-amber-300 shadow-sm" />
          )}
        </div>
      );
    };

    return (
      <div className="flex items-center justify-center gap-1.5 flex-wrap p-1">
        {Array.from({ length: count }).map((_, i) => renderSingleShape(i))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100">
      {/* Top Poki Bar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="./assets/fox_icon.png"
            alt="Fox"
            className="w-10 h-10 rounded-xl object-cover border border-amber-500/40"
          />
          <div>
            <h1 className="font-black text-white tracking-wide text-base flex items-center gap-2">
              FOX LOGIC <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">MENSA & RAVEN IQ</span>
            </h1>
            <div className="text-[11px] text-slate-400">
              {currentLevel.worldName} • {currentLevel.gridSize === 3 ? '3×3 Matrix' : '2×2 Induction'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-bold">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>IQ {estimatedIQ}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{totalStars} / 150</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Ses Aç/Kapat"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <a
            href="/api/poki/download-zip"
            download="fox-logic-brain-quest-poki.zip"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-slate-950 text-xs font-black transition shadow cursor-pointer"
            title="Poki İçin Hazır ZIP Dosyasını İndir"
          >
            <Download className="w-3.5 h-3.5" />
            Poki ZIP İndir
          </a>

          <a
            href="https://github.com/muratteknofest-stack/fox-logic-brain-quest"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow cursor-pointer"
          >
            <Github className="w-3.5 h-3.5" />
            GitHub Repo ↗
          </a>
        </div>
      </header>

      {/* Screen 1: TITLE MENU */}
      {screen === 'TITLE' && (
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-8 min-h-[520px]">
          <div className="relative">
            <img
              src="./assets/fox_icon.png"
              alt="Fox"
              className="w-32 h-32 rounded-3xl object-cover border-4 border-amber-400/80 shadow-2xl shadow-amber-500/30 animate-bounce"
            />
          </div>

          <div className="space-y-2 max-w-md">
            <h2 className="text-3xl font-black text-white tracking-tight">
              FOX LOGIC: ADVANCED BRAIN QUEST
            </h2>
            <p className="text-sm text-slate-300">
              Challenge your mind with 50 progressive levels: 2×2 compound analogies and authentic <b>3×3 Raven Progressive Matrices</b>. Deceptive distractors require genuine logical deduction!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={() => {
                playSound('click');
                setScreen('MAP');
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/25 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              PLAY NOW (50 LEVELS)
            </button>

            <a
              href="/api/poki/download-zip"
              download="fox-logic-brain-quest-poki.zip"
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              POKI ZIP İNDİR (2.0 MB)
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span>5 Worlds: Apprentice to Mensa Apex</span>
            <span>•</span>
            <span>3×3 Raven Matrices</span>
            <span>•</span>
            <span>PokiSDK v2 Ready</span>
          </div>
        </div>
      )}

      {/* Screen 2: 50-LEVEL MAP */}
      {screen === 'MAP' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                playSound('click');
                setScreen('TITLE');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Main Menu
            </button>

            <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              World 1-5 • Levels 1–50 (Raven & Mensa Tiers)
            </div>
          </div>

          {/* Grid of 50 Levels */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 max-h-[460px] overflow-y-auto p-1">
            {ALL_POKI_LEVELS.map((lvl) => {
              const prog = progress[lvl.id] || { unlocked: false, stars: 0 };
              const isCurrent = currentLevelId === lvl.id;
              const is3x3 = lvl.gridSize === 3;

              return (
                <button
                  key={lvl.id}
                  disabled={!prog.unlocked}
                  onClick={() => handleStartLevel(lvl.id)}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition border ${
                    !prog.unlocked
                      ? 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                      : isCurrent
                      ? 'bg-gradient-to-b from-amber-500 to-orange-600 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/30 scale-105 font-black cursor-pointer'
                      : is3x3
                      ? 'bg-slate-800/90 hover:bg-slate-700 border-indigo-500/50 text-indigo-200 font-bold cursor-pointer'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white font-bold cursor-pointer'
                  }`}
                  title={`${lvl.worldName} • ${lvl.ruleName}`}
                >
                  {!prog.unlocked ? (
                    <Lock className="w-4 h-4 text-slate-600" />
                  ) : (
                    <>
                      <span className="text-xs">{lvl.id}</span>
                      {is3x3 && (
                        <span className="text-[8px] font-black text-amber-400 leading-none">3×3</span>
                      )}
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: 3 }).map((_, s) => (
                          <Star
                            key={s}
                            className={`w-2 h-2 ${
                              s < prog.stars
                                ? 'text-amber-300 fill-amber-300'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 3: ACTIVE GAMEPLAY */}
      {screen === 'PLAYING' && (
        <div className="p-6 space-y-5">
          {/* Top HUD */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <button
              onClick={() => {
                poki.gameplayStop();
                playSound('click');
                setScreen('MAP');
              }}
              className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Map
            </button>

            <div className="text-center space-y-0.5">
              <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center justify-center gap-2">
                <span>{currentLevel.worldName} • Level {currentLevelId}</span>
                {streakCount >= 2 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3 fill-orange-400" />
                    {streakCount}x Combo!
                  </span>
                )}
              </div>
              <div className="text-[11px] text-indigo-300 font-semibold">
                Rule: {currentLevel.ruleName}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs font-mono text-slate-400">
                ⏱️ {timeLeft}s
              </div>
              <button
                onClick={handleUseHint}
                disabled={hintUsed}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
                  hintUsed
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:brightness-110 text-slate-950 cursor-pointer animate-pulse'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {hintUsed ? 'Hint Used' : '💡 Hint (Ad)'}
              </button>
            </div>
          </div>

          {adMessage && (
            <div className="rounded-xl bg-amber-500/20 border border-amber-500/40 p-3 text-center text-xs font-bold text-amber-300 animate-pulse">
              {adMessage}
            </div>
          )}

          {/* Central Puzzle Board: Dynamically 2x2 or 3x3 Raven Matrix */}
          <div
            className={`max-w-md mx-auto aspect-square rounded-3xl bg-slate-950 border-2 border-slate-800 p-3 grid gap-2.5 transition-transform ${
              currentLevel.gridSize === 3 ? 'grid-cols-3' : 'grid-cols-2'
            } ${isWrongShake ? 'translate-x-2 border-rose-500 duration-100' : ''}`}
          >
            {currentLevel.cards.map((card, i) => (
              <div
                key={i}
                className={`rounded-2xl flex items-center justify-center border ${
                  card === null
                    ? 'bg-amber-500/10 border-dashed border-2 border-amber-400/80 shadow-inner'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {renderCardShape(card, currentLevel.gridSize === 3)}
              </div>
            ))}
          </div>

          {/* 4 Deceptive Options Grid (A, B, C, D) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            {currentLevel.options.map((opt) => {
              const isEliminated = eliminatedOptions.includes(opt.id);
              const isSelected = selectedOptionId === opt.id;
              const isCorrect = opt.id === currentLevel.correctId;

              return (
                <button
                  key={opt.id}
                  disabled={isEliminated || selectedOptionId !== null}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-between p-2.5 transition transform active:scale-95 cursor-pointer ${
                    isEliminated
                      ? 'bg-slate-950/40 border-slate-800 opacity-20 cursor-not-allowed'
                      : isSelected && isCorrect
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 scale-105'
                      : isSelected && !isCorrect
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-850 hover:bg-slate-800 border-slate-700 hover:border-amber-400/60'
                  }`}
                >
                  <span className="text-xs font-black text-slate-400 self-start">
                    {opt.id}
                  </span>
                  <div className="w-full flex-1 flex items-center justify-center">
                    {renderCardShape(opt, false)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 4: VICTORY MODAL */}
      {screen === 'VICTORY' && (
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-6 min-h-[460px]">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-3xl font-black">
            🎉
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">BRILLIANT DEDUCTION!</h2>
            <p className="text-xs text-slate-400">
              {currentLevel.hintExplanation}
            </p>
          </div>

          {/* Stars Earned */}
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, s) => {
              const currentStars = progress[currentLevelId]?.stars || 1;
              return (
                <Star
                  key={s}
                  className={`w-8 h-8 ${
                    s < currentStars
                      ? 'text-amber-400 fill-amber-400 animate-bounce'
                      : 'text-slate-700'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleStartLevel(currentLevelId)}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              Replay Level
            </button>
            <button
              onClick={handleNextLevel}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              <span>NEXT LEVEL</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 5: GAME OVER MODAL */}
      {screen === 'GAME_OVER' && (
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-6 min-h-[460px]">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 text-3xl font-black">
            ⌛
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">CHALLENGE FAILED</h2>
            <p className="text-xs text-slate-400">
              Analyze the row and column patterns carefully before making your move.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleStartLevel(currentLevelId)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => setScreen('MAP')}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              Level Map
            </button>
          </div>
        </div>
      )}

      {/* Developer Poki & GitHub Info Footer */}
      <footer className="px-6 py-3.5 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Poki SDK <b>commercialBreak</b> & <b>rewardedBreak</b> Entegre Edildi.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://developers.poki.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold"
          >
            Poki Developers Portal ↗
          </a>
        </div>
      </footer>
    </div>
  );
};

export default FoxLogicPokiGame;
