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
  Music,
  Box,
  Layers,
  Eye,
  KeyRound,
} from 'lucide-react';
import { poki } from '../poki/pokiBridge';
import { ALL_50_BILSEM_LEVELS, PokiBilsemLevel } from '../poki/bilsemLevels';
import { BilsemPuzzle, ShapeType, MatrixCellSpec, CubeCoord } from '../types/puzzle';
import { startBackgroundMusic, BackgroundMusicController } from '../utils/musicEngine';
import ConfettiCanvas from './ConfettiCanvas';

type GameScreen = 'TITLE' | 'MAP' | 'PLAYING' | 'VICTORY' | 'GAME_OVER';

interface LevelProgress {
  unlocked: boolean;
  stars: number; // 0 to 3
  bestTimeSec: number;
}

const STORAGE_KEY = 'fox_logic_bilsem_v3';

export const FoxLogicPokiGame: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
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
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isWrongShake, setIsWrongShake] = useState<boolean>(false);
  const [adMessage, setAdMessage] = useState<string | null>(null);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicCtrlRef = useRef<BackgroundMusicController | null>(null);

  // Background Music Lifecycle
  useEffect(() => {
    if (!musicEnabled) {
      if (musicCtrlRef.current) {
        musicCtrlRef.current.stop();
        musicCtrlRef.current = null;
      }
      return;
    }

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

      if (!musicCtrlRef.current) {
        musicCtrlRef.current = startBackgroundMusic(
          ctx,
          ctx.destination,
          'playful_marimba',
          28,
          9999
        );
      }
    } catch {}

    return () => {
      if (musicCtrlRef.current) {
        musicCtrlRef.current.stop();
        musicCtrlRef.current = null;
      }
    };
  }, [musicEnabled]);

  // Synthetic Retro Sound FX
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

  const currentLevel: PokiBilsemLevel =
    ALL_50_BILSEM_LEVELS[currentLevelId - 1] || ALL_50_BILSEM_LEVELS[0];
  const puzzle = currentLevel.puzzle;

  const handleStartLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setTimeLeft(60);
    setEliminatedOptions([]);
    setHintUsed(false);
    setSelectedOptionIndex(null);
    setIsWrongShake(false);
    playSound('click');
    setScreen('PLAYING');
    poki.gameplayStart();
  };

  const handleSelectOption = (index: number) => {
    if (selectedOptionIndex !== null || screen !== 'PLAYING') return;
    setSelectedOptionIndex(index);

    if (index === puzzle.correctOptionIndex) {
      // Correct!
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      if (newStreak >= 2) {
        playSound('combo');
      } else {
        playSound('correct');
      }
      poki.gameplayStop();

      const timeSpent = 60 - timeLeft;
      let stars = 1;
      if (timeSpent < 18 && !hintUsed) stars = 3;
      else if (timeSpent < 40) stars = 2;

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
        setSelectedOptionIndex(null);
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
      const wrongIndices = [0, 1, 2, 3].filter((i) => i !== puzzle.correctOptionIndex);
      setEliminatedOptions(wrongIndices.slice(0, 2));
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

  // Render SVG geometric shape
  const renderShapeSvg = (
    shape: ShapeType,
    color: string,
    rotation = 0,
    filled = true,
    innerDot = false,
    size = 28
  ) => {
    const style: React.CSSProperties = {
      transform: `rotate(${rotation}deg)`,
      transition: 'transform 0.25s ease',
    };

    return (
      <div style={style} className="relative flex items-center justify-center">
        {shape === 'star' && (
          <svg style={{ width: size, height: size }} viewBox="0 0 24 24">
            <polygon
              points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.5"
            />
          </svg>
        )}
        {shape === 'circle' && (
          <svg style={{ width: size, height: size }} viewBox="0 0 24 24">
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
          <svg style={{ width: size, height: size }} viewBox="0 0 24 24">
            <polygon
              points="12,3 22,21 2,21"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.5"
            />
          </svg>
        )}
        {shape === 'diamond' && (
          <svg style={{ width: size, height: size }} viewBox="0 0 24 24">
            <polygon
              points="12,2 22,12 12,22 2,12"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.5"
            />
          </svg>
        )}
        {shape === 'pentagon' && (
          <svg style={{ width: size, height: size }} viewBox="0 0 24 24">
            <polygon
              points="12,2 22,9 18,21 6,21 2,9"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.5"
            />
          </svg>
        )}
        {shape === 'hexagon' && (
          <svg style={{ width: size, height: size }} viewBox="0 0 24 24">
            <polygon
              points="12,2 21,7 21,17 12,22 3,17 3,7"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.5"
            />
          </svg>
        )}
        {shape === 'cross' && (
          <svg style={{ width: size, height: size }} viewBox="0 0 24 24">
            <polygon
              points="9,2 15,2 15,9 22,9 22,15 15,15 15,22 9,22 9,15 2,15 2,9 9,9"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="1.8"
            />
          </svg>
        )}
        {shape === 'square' && (
          <svg style={{ width: size, height: size }} viewBox="0 0 24 24">
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
        {innerDot && (
          <div className="absolute w-2 h-2 rounded-full bg-white shadow-sm" />
        )}
      </div>
    );
  };

  // Render 3D Isometric Cube in SVG
  const render3DCube = (x: number, y: number, color = '#3B82F6', size = 32) => {
    const cos30 = Math.cos(Math.PI / 6) * size;
    const sin30 = Math.sin(Math.PI / 6) * size;

    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Top face */}
        <polygon
          points={`0,${-size * 0.6} ${cos30},${-size * 0.1} 0,${size * 0.4} ${-cos30},${-size * 0.1}`}
          fill="#93C5FD"
          stroke="#1E293B"
          strokeWidth="1.5"
        />
        {/* Left face */}
        <polygon
          points={`${-cos30},${-size * 0.1} 0,${size * 0.4} 0,${size * 1.1} ${-cos30},${size * 0.6}`}
          fill={color}
          stroke="#1E293B"
          strokeWidth="1.5"
        />
        {/* Right face */}
        <polygon
          points={`0,${size * 0.4} ${cos30},${-size * 0.1} ${cos30},${size * 0.6} 0,${size * 1.1}`}
          fill="#1D4ED8"
          stroke="#1E293B"
          strokeWidth="1.5"
        />
      </g>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border-2 border-indigo-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col text-slate-100 relative">
      {/* Confetti Explosion on Victory */}
      {screen === 'VICTORY' && <ConfettiCanvas />}

      {/* Top Colorful Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/assets/aistudio/B_LSEM_Junior_tilki_ikonu_e352f23b.png"
              alt="Fox"
              className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-400 shadow-md shadow-amber-500/20"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900 flex items-center justify-center text-[9px] font-black text-slate-950">
              ✓
            </span>
          </div>
          <div>
            <h1 className="font-black text-white tracking-wide text-base flex items-center gap-2">
              FOX LOGIC <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">BİLSEM JUNIOR</span>
            </h1>
            <div className="text-[11px] text-amber-300 font-semibold">
              {currentLevel.worldName} • {currentLevel.categoryLabel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>IQ {estimatedIQ}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{totalStars} / 150</span>
          </div>

          <button
            onClick={() => setMusicEnabled(!musicEnabled)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              musicEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="Arka Plan Müziği Aç/Kapat"
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Ses Efektleri Aç/Kapat"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <a
            href="/api/poki/download-zip"
            download="fox-logic-brain-quest-poki.zip"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-slate-950 text-xs font-black transition shadow-md shadow-emerald-500/20 cursor-pointer"
            title="Poki İçin Hazır ZIP Paketini İndir"
          >
            <Download className="w-3.5 h-3.5" />
            Poki ZIP
          </a>
        </div>
      </header>

      {/* Screen 1: COLORFUL TITLE MENU */}
      {screen === 'TITLE' && (
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[520px] bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500 rounded-full blur-xl opacity-40 animate-pulse" />
            <img
              src="/assets/aistudio/B_LSEM_Junior_tilki_ikonu_e352f23b.png"
              alt="Fox"
              className="relative w-32 h-32 rounded-3xl object-cover border-4 border-amber-400 shadow-2xl animate-bounce"
            />
          </div>

          <div className="space-y-3 max-w-lg">
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-indigo-300 tracking-tight">
              FOX LOGIC: BİLSEM QUEST
            </h2>
            <p className="text-sm text-slate-300 font-medium">
              BİLSEM 1, 2 ve 3. Sınıf Seviyesinde 50 Gerçek Zeka Sorusu! 3B Küp Kuleleri, 3×3 Raven Matrisleri, Gölge Eşleme ve Şifre Çözme Maceraları.
            </p>
          </div>

          {/* Big 3D Cartoon Play Button */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={() => {
                playSound('click');
                setScreen('MAP');
              }}
              className="flex-1 inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 font-black text-base shadow-[0_6px_0_#b45309] hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#b45309] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              HEMEN OYNA (50 SEVİYE)
            </button>

            <a
              href="/api/poki/download-zip"
              download="fox-logic-brain-quest-poki.zip"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/50 text-emerald-300 font-bold text-xs shadow-[0_4px_0_#064e3b] active:translate-y-1 active:shadow-[0_1px_0_#064e3b] transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              POKI ZIP İNDİR (2.0 MB)
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 text-indigo-300"><Layers className="w-4 h-4 text-indigo-400" /> 3B Küpler</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-amber-300"><Eye className="w-4 h-4 text-amber-400" /> Gölge & Yansıma</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-300"><Brain className="w-4 h-4 text-emerald-400" /> 3×3 Matrisler</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-cyan-300"><KeyRound className="w-4 h-4 text-cyan-400" /> Şifreleme</span>
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
              Ana Menü
            </button>

            <div className="text-xs font-black text-amber-400 flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              BİLSEM Junior • 50 Seviyelik Zeka Haritası
            </div>
          </div>

          {/* Grid of 50 Levels */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 max-h-[460px] overflow-y-auto p-1">
            {ALL_50_BILSEM_LEVELS.map((lvl) => {
              const prog = progress[lvl.id] || { unlocked: false, stars: 0 };
              const isCurrent = currentLevelId === lvl.id;

              return (
                <button
                  key={lvl.id}
                  disabled={!prog.unlocked}
                  onClick={() => handleStartLevel(lvl.id)}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition border ${
                    !prog.unlocked
                      ? 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                      : isCurrent
                      ? 'bg-gradient-to-b from-amber-400 to-orange-500 border-amber-300 text-slate-950 shadow-[0_4px_0_#b45309] scale-105 font-black cursor-pointer'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white font-bold shadow-[0_3px_0_#1e293b] active:translate-y-0.5 cursor-pointer'
                  }`}
                  title={`${lvl.worldName} • ${lvl.categoryLabel}`}
                >
                  {!prog.unlocked ? (
                    <Lock className="w-4 h-4 text-slate-600" />
                  ) : (
                    <>
                      <span className="text-xs font-black">{lvl.id}</span>
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

      {/* Screen 3: ACTIVE GAMEPLAY (BİLSEM QUESTION ENGINE) */}
      {screen === 'PLAYING' && (
        <div className="p-6 space-y-5">
          {/* Top In-Game HUD */}
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
              Harita
            </button>

            <div className="text-center space-y-0.5">
              <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center justify-center gap-2">
                <span>{currentLevel.worldName} • Bölüm {currentLevelId}</span>
                {streakCount >= 2 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3 fill-orange-400" />
                    {streakCount}x Kombo!
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300 font-bold">
                {puzzle.questionPrompt}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs font-mono font-bold text-slate-300 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700">
                ⏱️ {timeLeft}s
              </div>
              <button
                onClick={handleUseHint}
                disabled={hintUsed}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition shadow ${
                  hintUsed
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_3px_0_#b45309] active:translate-y-0.5 cursor-pointer animate-pulse'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {hintUsed ? 'İpucu Aktif' : '💡 İpucu (Ad)'}
              </button>
            </div>
          </div>

          {adMessage && (
            <div className="rounded-xl bg-amber-500/20 border border-amber-500/40 p-3 text-center text-xs font-bold text-amber-300 animate-pulse">
              {adMessage}
            </div>
          )}

          {/* Central Question Stage Card */}
          <div
            className={`max-w-md mx-auto aspect-square rounded-3xl bg-slate-950 border-2 border-slate-800 p-4 flex items-center justify-center shadow-xl transition-transform ${
              isWrongShake ? 'translate-x-2 border-rose-500 duration-100' : ''
            }`}
          >
            {/* 1. Category: 3x3 or 2x2 Matrix */}
            {puzzle.category === 'matrix' && puzzle.matrixSpec && (
              <div className="w-full h-full grid grid-cols-3 gap-2 p-1">
                {puzzle.matrixSpec.grid.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border flex items-center justify-center ${
                      cell === null
                        ? 'bg-amber-500/15 border-dashed border-2 border-amber-400 text-amber-400 text-3xl font-black animate-pulse'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {cell ? (
                      <div className="flex items-center justify-center gap-1 flex-wrap p-1">
                        {Array.from({ length: cell.count || 1 }).map((_, cIdx) => (
                          <React.Fragment key={cIdx}>
                            {renderShapeSvg(cell.shape, cell.color, cell.rotation, cell.filled, cell.innerDot, 24)}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      '?'
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 2. Category: 3D Isometric Cube Stacking */}
            {puzzle.category === 'cube3d' && puzzle.cubeSpec && (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <svg className="w-64 h-64 overflow-visible" viewBox="-120 -120 240 240">
                  {puzzle.cubeSpec.cubes.map((c, cIdx) => {
                    const size = 32;
                    const cos30 = Math.cos(Math.PI / 6) * size;
                    const sin30 = Math.sin(Math.PI / 6) * size;
                    const screenX = (c.x - c.y) * cos30;
                    const screenY = (c.x + c.y) * sin30 - c.z * size;

                    return (
                      <React.Fragment key={cIdx}>
                        {render3DCube(screenX, screenY, puzzle.cubeSpec?.paletteColor || '#3B82F6', size)}
                      </React.Fragment>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* 3. Category: Shadow & Reflection */}
            {puzzle.category === 'shadow' && puzzle.shadowSpec && (
              <div className="w-full h-full flex items-center justify-center gap-6">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {renderShapeSvg(
                    puzzle.shadowSpec.target.shape,
                    puzzle.shadowSpec.target.primaryColor,
                    puzzle.shadowSpec.target.rotation,
                    true,
                    false,
                    48
                  )}
                </div>
                <span className="text-xl font-bold text-slate-500">➜</span>
                <div className="p-4 rounded-2xl bg-slate-900 border border-dashed border-amber-400/80 flex items-center justify-center text-amber-400 font-black text-2xl">
                  ?
                </div>
              </div>
            )}

            {/* 4. Category: Cipher & Symbol Substitution */}
            {puzzle.category === 'cipher' && puzzle.cipherSpec && (
              <div className="w-full h-full flex flex-col justify-around p-2">
                {puzzle.cipherSpec.rows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className={`px-4 py-2 rounded-xl border flex items-center justify-between ${
                      row.isQuestionRow
                        ? 'bg-amber-500/10 border-amber-400'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {row.symbols.map((sym, sIdx) => (
                        <React.Fragment key={sIdx}>
                          {renderShapeSvg(sym, row.symbolColors[sIdx] || '#4F46E5', 0, true, false, 20)}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="text-slate-400 font-bold">➜</span>
                    <span className={`font-mono font-black text-base ${row.isQuestionRow ? 'text-amber-400' : 'text-white'}`}>
                      {row.codeOutput}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4 Option Buttons (A, B, C, D) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            {puzzle.options.map((opt, optIndex) => {
              const isEliminated = eliminatedOptions.includes(optIndex);
              const isSelected = selectedOptionIndex === optIndex;
              const isCorrect = optIndex === puzzle.correctOptionIndex;
              const letters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={optIndex}
                  disabled={isEliminated || selectedOptionIndex !== null}
                  onClick={() => handleSelectOption(optIndex)}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-between p-3 transition-all cursor-pointer shadow-[0_4px_0_#1e293b] active:translate-y-1 active:shadow-none ${
                    isEliminated
                      ? 'bg-slate-950/40 border-slate-800 opacity-20 cursor-not-allowed'
                      : isSelected && isCorrect
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 scale-105 shadow-[0_4px_0_#059669]'
                      : isSelected && !isCorrect
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-850 hover:bg-slate-800 border-slate-700 hover:border-amber-400/80'
                  }`}
                >
                  <span className="text-xs font-black text-slate-400 self-start">
                    {letters[optIndex]}
                  </span>

                  <div className="w-full flex-1 flex items-center justify-center">
                    {/* Render option content based on category */}
                    {puzzle.category === 'matrix' && (
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {Array.from({ length: (opt as MatrixCellSpec).count || 1 }).map((_, cIdx) => (
                          <React.Fragment key={cIdx}>
                            {renderShapeSvg(
                              (opt as MatrixCellSpec).shape,
                              (opt as MatrixCellSpec).color,
                              (opt as MatrixCellSpec).rotation,
                              (opt as MatrixCellSpec).filled,
                              (opt as MatrixCellSpec).innerDot,
                              26
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {puzzle.category === 'cube3d' && (
                      <span className="font-mono text-2xl font-black text-white">
                        {String(opt)}
                      </span>
                    )}

                    {puzzle.category === 'shadow' && (
                      <div>
                        {renderShapeSvg(
                          (opt as { shape: ShapeType; rotation: number }).shape,
                          '#F59E0B',
                          (opt as { shape: ShapeType; rotation: number }).rotation,
                          true,
                          false,
                          34
                        )}
                      </div>
                    )}

                    {puzzle.category === 'cipher' && (
                      <span className="font-mono text-2xl font-black text-amber-300">
                        {String(opt)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 4: CELEBRATORY VICTORY MODAL WITH ANIMATED STARS */}
      {screen === 'VICTORY' && (
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[460px] relative z-20">
          <div className="relative">
            <img
              src="/assets/aistudio/B_LSEM_Junior_tilki_ikonu_e352f23b.png"
              alt="Fox Happy"
              className="w-24 h-24 rounded-3xl object-cover border-4 border-amber-400 shadow-xl shadow-amber-500/30 animate-bounce"
            />
            <span className="absolute -top-3 -right-3 text-3xl">👑</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-300">
              TEBRİKLER! BÖLÜM GEÇİLDİ!
            </h2>
            <p className="text-xs text-slate-300 max-w-sm font-medium">
              {puzzle.explanation}
            </p>
          </div>

          {/* Animated 3 Stars */}
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, s) => {
              const currentStars = progress[currentLevelId]?.stars || 1;
              const hasStar = s < currentStars;

              return (
                <div
                  key={s}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all transform ${
                    hasStar
                      ? 'bg-amber-500/20 border-amber-400 scale-110 shadow-lg shadow-amber-500/30'
                      : 'bg-slate-900 border-slate-800 opacity-40'
                  }`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      hasStar ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-600'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleStartLevel(currentLevelId)}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 shadow-[0_3px_0_#1e293b] active:translate-y-0.5 transition cursor-pointer"
            >
              Tekrar Oyna
            </button>
            <button
              onClick={handleNextLevel}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-[0_5px_0_#b45309] hover:brightness-105 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              <span>SONRAKİ BÖLÜM</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 5: GAME OVER MODAL */}
      {screen === 'GAME_OVER' && (
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[460px]">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 text-3xl font-black">
            ⌛
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">SÜRE DOLDU!</h2>
            <p className="text-xs text-slate-400 max-w-xs">
              Pes etmek yok! BİLSEM soruları odaklanma ve pratikle çok daha kolaylaşır.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleStartLevel(currentLevelId)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-[0_4px_0_#b45309] active:translate-y-0.5 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Tekrar Dene
            </button>
            <button
              onClick={() => setScreen('MAP')}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              Bölüm Haritası
            </button>
          </div>
        </div>
      )}

      {/* Poki Developer & Ad Footer */}
      <footer className="px-6 py-3.5 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            BİLSEM Junior Soru Motoru • PokiSDK <b>commercialBreak</b> & <b>rewardedBreak</b> Entegre
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
