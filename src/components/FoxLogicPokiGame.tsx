import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
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
  Download,
  Flame,
  Brain,
  Music,
  Layers,
  Eye,
  KeyRound,
  Unlock,
  Trophy,
  Zap,
} from 'lucide-react';
import { poki } from '../poki/pokiBridge';
import { ALL_50_BILSEM_LEVELS, PokiBilsemLevel } from '../poki/bilsemLevels';
import {
  ShapeType,
  MatrixCellSpec,
  CubeCoord,
  ShadowOptionSpec,
  MusicTrackId,
} from '../types/puzzle';
import {
  startBackgroundMusic,
  BackgroundMusicController,
  MUSIC_TRACK_LABELS,
} from '../utils/musicEngine';
import ConfettiCanvas from './ConfettiCanvas';

type GameScreen = 'TITLE' | 'MAP' | 'PLAYING' | 'VICTORY' | 'GAME_OVER';

interface LevelProgress {
  unlocked: boolean;
  stars: number; // 0 to 3
  bestTimeSec: number;
}

const STORAGE_KEY = 'fox_logic_bilsem_v4';

const TRACK_CYCLE: MusicTrackId[] = [
  'playful_marimba',
  'quiz_show',
  'cosmic_synth',
  'lofi_focus',
];

const OPTION_BADGE_COLORS = [
  'from-pink-500 to-rose-600 shadow-[0_4px_0_#9f1239] border-pink-300',
  'from-sky-500 to-blue-600 shadow-[0_4px_0_#1e40af] border-sky-300',
  'from-amber-400 to-orange-500 shadow-[0_4px_0_#b45309] border-amber-200',
  'from-emerald-400 to-teal-600 shadow-[0_4px_0_#065f46] border-emerald-200',
];

export const FoxLogicPokiGame: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [musicTrack, setMusicTrack] = useState<MusicTrackId>('playful_marimba');
  const [streakCount, setStreakCount] = useState<number>(0);
  const [xpPoints, setXpPoints] = useState<number>(250);

  // Arcade transition state
  const [transitionBanner, setTransitionBanner] = useState<{
    active: boolean;
    title: string;
    subtitle: string;
    color: string;
  }>({
    active: false,
    title: '',
    subtitle: '',
    color: 'from-amber-400 via-orange-500 to-pink-500',
  });

  // In-game celebration state before switching to victory screen
  const [celebratingCorrect, setCelebratingCorrect] = useState<boolean>(false);
  const [confettiBurstKey, setConfettiBurstKey] = useState<number>(0);

  const [progress, setProgress] = useState<Record<number, LevelProgress>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    const initial: Record<number, LevelProgress> = {};
    for (let i = 1; i <= 50; i++) {
      // Unlock first 8 levels by default so player can immediately play Matrix, 3D Cubes, Shadow, and Cipher!
      initial[i] = {
        unlocked: i <= 8,
        stars: 0,
        bestTimeSec: 999,
      };
    }
    return initial;
  });

  // Gameplay states
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isWrongShake, setIsWrongShake] = useState<boolean>(false);
  const [adMessage, setAdMessage] = useState<string | null>(null);
  const [foxSpeech, setFoxSpeech] = useState<string>(
    'İpuçlarını incele ve doğru şıkkı yakala! 🦊✨'
  );

  // 3D Tilt & Gamification States
  const [stageTilt, setStageTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [xpFloater, setXpFloater] = useState<{ id: number; text: string } | null>(null);

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStageTilt({ rx: -y * 14, ry: x * 14 });
  };

  const handleStageMouseLeave = () => {
    setStageTilt({ rx: 0, ry: 0 });
  };

  const handleFoxClick = () => {
    playSound('combo');
    const tips = [
      'Beni tıkladın! 🦊 Çok iyi gidiyorsun, devam et!',
      'Gözün yükseklerde olsun, BİLSEM IQ seviyen tırmanıyor! 🚀🦊',
      'Acele etme, örüntüdeki dönüş kurallarını iyi yakala! 🧠✨',
      'Görünmeyen küpleri de saymayı unutma! 🧊🦊',
      'Harika gidiyorsun! Kombo alevini söndürme! 🔥🦊',
    ];
    setFoxSpeech(tips[Math.floor(Math.random() * tips.length)]);
  };

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<BackgroundMusicController | null>(null);

  const getAudioCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Ensure background music starts on user interaction
  const syncBackgroundMusic = useCallback(
    (forceStart = false) => {
      if (!musicEnabled) {
        if (bgMusicRef.current) {
          bgMusicRef.current.stop();
          bgMusicRef.current = null;
        }
        return;
      }
      const ctx = getAudioCtx();
      if (!ctx) return;

      if (forceStart || !bgMusicRef.current) {
        if (bgMusicRef.current) {
          bgMusicRef.current.stop();
        }
        bgMusicRef.current = startBackgroundMusic(
          ctx,
          ctx.destination,
          musicTrack,
          70,
          300
        );
      }
    },
    [musicEnabled, musicTrack, getAudioCtx]
  );

  useEffect(() => {
    if (!musicEnabled) {
      if (bgMusicRef.current) {
        bgMusicRef.current.stop();
        bgMusicRef.current = null;
      }
    } else if (audioCtxRef.current) {
      syncBackgroundMusic(true);
    }
  }, [musicEnabled, musicTrack, syncBackgroundMusic]);

  useEffect(() => {
    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.stop();
        bgMusicRef.current = null;
      }
    };
  }, []);

  // Arcade Sound Effects
  const playSound = useCallback(
    (
      type:
        | 'click'
        | 'correct'
        | 'wrong'
        | 'hint'
        | 'fanfare'
        | 'combo'
        | 'swoosh'
    ) => {
      // Also wake up background music on first click!
      if (musicEnabled && !bgMusicRef.current) {
        syncBackgroundMusic(true);
      }
      if (!soundEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === 'swoosh') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);
          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
          osc.start(now);
          osc.stop(now + 0.24);
        } else if (type === 'correct') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.09); // E5
          osc.frequency.setValueAtTime(783.99, now + 0.18); // G5
          osc.frequency.setValueAtTime(1046.5, now + 0.27); // C6
          gain.gain.setValueAtTime(0.24, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
        } else if (type === 'combo') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(587.33, now);
          osc.frequency.setValueAtTime(783.99, now + 0.08);
          osc.frequency.setValueAtTime(987.77, now + 0.16);
          osc.frequency.setValueAtTime(1174.66, now + 0.24);
          gain.gain.setValueAtTime(0.28, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.48);
          osc.start(now);
          osc.stop(now + 0.48);
        } else if (type === 'wrong') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.linearRampToValueAtTime(130, now + 0.28);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.28);
        } else if (type === 'hint') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(1320, now + 0.22);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
        } else if (type === 'fanfare') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.12);
          osc.frequency.setValueAtTime(783.99, now + 0.24);
          osc.frequency.setValueAtTime(1046.5, now + 0.36);
          gain.gain.setValueAtTime(0.28, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);
          osc.start(now);
          osc.stop(now + 0.75);
        }
      } catch {}
    },
    [getAudioCtx, musicEnabled, syncBackgroundMusic]
  );

  // Trigger Arcade Curtain Transition between screens
  const runGameTransition = (
    targetScreen: GameScreen,
    title: string,
    subtitle: string,
    color = 'from-amber-400 via-orange-500 to-pink-500',
    onMidpoint?: () => void
  ) => {
    playSound('swoosh');
    setTransitionBanner({
      active: true,
      title,
      subtitle,
      color,
    });
    setTimeout(() => {
      if (onMidpoint) onMidpoint();
      setScreen(targetScreen);
    }, 280);
    setTimeout(() => {
      setTransitionBanner((prev) => ({ ...prev, active: false }));
    }, 680);
  };

  // Init Poki SDK on mount
  useEffect(() => {
    void poki.init().then(() => {
      poki.gameLoadingFinished();
    });
  }, []);

  const saveProgressState = (newProg: Record<number, LevelProgress>) => {
    setProgress(newProg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProg));
    } catch {}
  };

  // Timer loop during playing
  useEffect(() => {
    if (screen !== 'PLAYING' || celebratingCorrect) return;
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
  }, [screen, celebratingCorrect, playSound]);

  const currentLevel: PokiBilsemLevel =
    ALL_50_BILSEM_LEVELS[currentLevelId - 1] || ALL_50_BILSEM_LEVELS[0];
  const puzzle = currentLevel.puzzle;

  const handleStartLevel = (levelId: number) => {
    const targetLvl =
      ALL_50_BILSEM_LEVELS[levelId - 1] || ALL_50_BILSEM_LEVELS[0];
    const colorsByCat: Record<string, string> = {
      matrix: 'from-indigo-500 via-purple-500 to-pink-500',
      cube3d: 'from-sky-400 via-blue-500 to-indigo-600',
      shadow: 'from-amber-400 via-orange-500 to-rose-500',
      cipher: 'from-emerald-400 via-teal-500 to-cyan-600',
    };

    runGameTransition(
      'PLAYING',
      `BÖLÜM ${levelId}`,
      `${targetLvl.categoryLabel} • ${targetLvl.puzzle.gradeLevel}`,
      colorsByCat[targetLvl.category] || 'from-amber-400 via-orange-500 to-pink-500',
      () => {
        setCurrentLevelId(levelId);
        setTimeLeft(60);
        setEliminatedOptions([]);
        setHintUsed(false);
        setSelectedOptionIndex(null);
        setCelebratingCorrect(false);
        setIsWrongShake(false);
        setFoxSpeech(
          targetLvl.category === 'cube3d'
            ? 'Üstteki küplerin altında gizlenen küpleri de saymayı unutma! 🧊🦊'
            : targetLvl.category === 'shadow'
            ? 'Birleşik şeklin duruş açısına ve iç parçasına dikkatli bak! 👀🦊'
            : targetLvl.category === 'cipher'
            ? 'Satırlardaki sembol ve kod eşleşmelerini çözerek şifreyi bul! 🔐🦊'
            : 'Satır ve sütundaki şekil, renk ve dönüş kuralını takip et! 🧠🦊'
        );
        poki.gameplayStart();
      }
    );
  };

  const handleUnlockAllLevels = () => {
    playSound('fanfare');
    const unlockedAll: Record<number, LevelProgress> = {};
    for (let i = 1; i <= 50; i++) {
      unlockedAll[i] = {
        unlocked: true,
        stars: progress[i]?.stars || 0,
        bestTimeSec: progress[i]?.bestTimeSec || 999,
      };
    }
    saveProgressState(unlockedAll);
    setConfettiBurstKey((k) => k + 1);
  };

  const handleCycleMusicTrack = () => {
    const idx = TRACK_CYCLE.indexOf(musicTrack);
    const next = TRACK_CYCLE[(idx + 1) % TRACK_CYCLE.length];
    setMusicTrack(next);
    setMusicEnabled(true);
    playSound('click');
  };

  const handleSelectOption = (index: number) => {
    if (selectedOptionIndex !== null || screen !== 'PLAYING') return;
    setSelectedOptionIndex(index);

    if (index === puzzle.correctOptionIndex) {
      // Correct Answer!
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      const gainedXp = 120 + newStreak * 30;
      setXpPoints((prev) => prev + gainedXp);
      setXpFloater({
        id: Date.now(),
        text: `+${gainedXp} XP ${newStreak >= 2 ? `🔥 ${newStreak}x KOMBO!` : '✨ BİLSEM DEHASI!'}`,
      });
      setTimeout(() => setXpFloater(null), 2000);
      setCelebratingCorrect(true);
      setConfettiBurstKey((k) => k + 1);
      setFoxSpeech('SÜPERSİN! Tam bir BİLSEM Zeka Küpüsün! 🎉🦊👑');

      if (newStreak >= 2) {
        playSound('combo');
      } else {
        playSound('correct');
      }
      poki.gameplayStop();

      const timeSpent = 60 - timeLeft;
      let stars = 1;
      if (timeSpent < 20 && !hintUsed) stars = 3;
      else if (timeSpent < 42) stars = 2;

      const nextProg = { ...progress };
      const currentStars = nextProg[currentLevelId]?.stars || 0;
      nextProg[currentLevelId] = {
        unlocked: true,
        stars: Math.max(currentStars, stars),
        bestTimeSec: Math.min(
          nextProg[currentLevelId]?.bestTimeSec || 999,
          timeSpent
        ),
      };
      if (currentLevelId < 50) {
        nextProg[currentLevelId + 1] = {
          ...nextProg[currentLevelId + 1],
          unlocked: true,
        };
      }
      saveProgressState(nextProg);

      setTimeout(() => {
        runGameTransition(
          'VICTORY',
          'HARİKA ÇÖZÜM! 🎉',
          `+${120 + newStreak * 30} XP Kazandın!`,
          'from-emerald-400 via-teal-500 to-cyan-500',
          () => {
            playSound('fanfare');
            void poki.commercialBreak();
          }
        );
      }, 1150);
    } else {
      // Wrong Answer!
      playSound('wrong');
      setStreakCount(0);
      setIsWrongShake(true);
      setFoxSpeech('Çok yaklaştın! İpucuna tekrar dikkatli bak! 💡🦊');
      setTimeout(() => {
        setIsWrongShake(false);
        setSelectedOptionIndex(null);
      }, 650);
    }
  };

  const handleUseHint = async () => {
    if (hintUsed || screen !== 'PLAYING') return;
    setAdMessage('🎬 Poki Ödüllü İpucu Videosu Oynatılıyor (2 Yanlış Şık Elenecek)…');
    const granted = await poki.rewardedBreak();
    setAdMessage(null);

    if (granted) {
      playSound('hint');
      setHintUsed(true);
      const wrongIndices = [0, 1, 2, 3].filter(
        (i) => i !== puzzle.correctOptionIndex
      );
      setEliminatedOptions(wrongIndices.slice(0, 2));
      setFoxSpeech('İki yanlış şıkkı senin için eledim! Şimdi çok daha kolay! 🎯🦊');
    }
  };

  const handleNextLevel = () => {
    if (currentLevelId < 50) {
      handleStartLevel(currentLevelId + 1);
    } else {
      runGameTransition(
        'MAP',
        'TEBRİKLER ŞAMPİYON!',
        '50 Seviyeyi Tamamladın!',
        'from-amber-400 via-orange-500 to-pink-500'
      );
    }
  };

  const totalStars = (Object.values(progress) as LevelProgress[]).reduce(
    (acc, p) => acc + (p.stars || 0),
    0
  );
  const completedCount = (Object.values(progress) as LevelProgress[]).filter(
    (p) => p.stars > 0
  ).length;
  const estimatedIQ = Math.min(
    160,
    105 + completedCount * 2 + streakCount * 3
  );

  // ============================================================================
  // EXACT BİLSEM JUNIOR GEOMETRIC & 3D SVG RENDERERS
  // ============================================================================
  const renderShapeSvg = (
    shape: ShapeType,
    color: string,
    rotation = 0,
    filled = true,
    innerDot = false,
    size = 36
  ) => {
    return (
      <div
        className="relative inline-flex items-center justify-center transition-transform duration-300"
        style={{
          width: size,
          height: size,
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {shape === 'star' && (
          <svg
            style={{ width: size, height: size }}
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <polygon
              points="12,1.8 15.1,8.1 22,9.1 17,14 18.2,21 12,17.7 5.8,21 7,14 2,9.1 8.9,8.1"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {shape === 'circle' && (
          <svg
            style={{ width: size, height: size }}
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <circle
              cx="12"
              cy="12"
              r="9.5"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.6"
            />
          </svg>
        )}
        {shape === 'triangle' && (
          <svg
            style={{ width: size, height: size }}
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <polygon
              points="12,2.5 22,20.5 2,20.5"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {shape === 'diamond' && (
          <svg
            style={{ width: size, height: size }}
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <polygon
              points="12,1.8 22.2,12 12,22.2 1.8,12"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {shape === 'pentagon' && (
          <svg
            style={{ width: size, height: size }}
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <polygon
              points="12,2 22,9.2 18.2,21 5.8,21 2,9.2"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {shape === 'hexagon' && (
          <svg
            style={{ width: size, height: size }}
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <polygon
              points="12,2 21,7 21,17 12,22 3,17 3,7"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {shape === 'cross' && (
          <svg
            style={{ width: size, height: size }}
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <polygon
              points="8.5,2 15.5,2 15.5,8.5 22,8.5 22,15.5 15.5,15.5 15.5,22 8.5,22 8.5,15.5 2,15.5 2,8.5 8.5,8.5"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {shape === 'square' && (
          <svg
            style={{ width: size, height: size }}
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="3.5"
              fill={filled ? color : 'none'}
              stroke={color}
              strokeWidth="2.6"
            />
          </svg>
        )}
        {innerDot && (
          <span
            className="absolute rounded-full shadow-sm"
            style={{
              width: Math.max(5, size * 0.22),
              height: Math.max(5, size * 0.22),
              backgroundColor: filled ? '#FFFFFF' : color,
            }}
          />
        )}
      </div>
    );
  };

  // Render BİLSEM Matrix Cell with proper 1, 2, 3, or 4 geometric formation
  const renderMatrixCellFormation = (
    cell: MatrixCellSpec,
    baseSize = 36
  ) => {
    const count = Math.max(1, Math.min(4, cell.count || 1));
    const singleSize =
      count === 1
        ? baseSize * 1.15
        : count === 2
        ? baseSize * 0.82
        : baseSize * 0.68;

    return (
      <div
        className={` items-center justify-center ${
          count >= 3 ? 'grid grid-cols-2 gap-1' : 'flex gap-1.5'
        }`}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className={
              count === 3 && idx === 0
                ? 'col-span-2 flex justify-center'
                : 'flex justify-center'
            }
          >
            {renderShapeSvg(
              cell.shape,
              cell.color,
              cell.rotation,
              cell.filled ?? true,
              cell.innerDot ?? false,
              singleSize
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render Composite BİLSEM Target or Silhouette Shadow (2 overlapping shapes!)
  const renderCompositeShadowFigure = (
    primaryShape: ShapeType,
    secondaryShape: ShapeType | undefined,
    primaryColor: string,
    secondaryColor: string,
    rotation: number,
    offsetX = 1,
    isSilhouette = false,
    mainSize = 86
  ) => {
    const pColor = isSilhouette ? '#0F172A' : primaryColor;
    const sColor = isSilhouette ? '#0F172A' : secondaryColor;
    const secSize = Math.round(mainSize * 0.52);

    return (
      <div className="relative inline-flex items-center justify-center">
        {renderShapeSvg(
          primaryShape,
          pColor,
          rotation,
          true,
          false,
          mainSize
        )}
        {secondaryShape && (
          <div
            className="absolute"
            style={{
              transform: `translate(${offsetX * (mainSize * 0.26)}px, ${-mainSize * 0.18}px)`,
            }}
          >
            {renderShapeSvg(
              secondaryShape,
              sColor,
              rotation + 30,
              true,
              !isSilhouette,
              secSize
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Depth-Sorted 3D Isometric Cube exactly like BİLSEM Junior canvasRenderer.ts
  const render3DCube = (
    cx: number,
    cy: number,
    baseColor = '#3B82F6',
    size = 34
  ) => {
    const cos30 = Math.cos(Math.PI / 6) * size;
    const sin30 = Math.sin(Math.PI / 6) * size;

    const topPoints = `${cx},${cy - size} ${cx + cos30},${cy - sin30} ${cx},${cy} ${cx - cos30},${cy - sin30}`;
    const leftPoints = `${cx - cos30},${cy - sin30} ${cx},${cy} ${cx},${cy + size} ${cx - cos30},${cy + sin30}`;
    const rightPoints = `${cx},${cy} ${cx + cos30},${cy - sin30} ${cx + cos30},${cy + sin30} ${cx},${cy + size}`;

    return (
      <g>
        {/* Top Face (Specular Highlight) */}
        <polygon
          points={topPoints}
          fill="#BAE6FD"
          stroke="#0F172A"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Left Face (Primary Palette Color) */}
        <polygon
          points={leftPoints}
          fill={baseColor}
          stroke="#0F172A"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Right Face (Deep Shadow) */}
        <polygon
          points={rightPoints}
          fill="#1D4ED8"
          stroke="#0F172A"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Top Face Specular Glare Line */}
        <line
          x1={cx}
          y1={cy - size * 0.9}
          x2={cx}
          y2={cy - size * 0.12}
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="1.8"
        />
      </g>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-[32px] bg-gradient-to-b from-indigo-900 via-purple-900 to-fuchsia-950 border-4 border-amber-400 shadow-[0_24px_60px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col text-white relative select-none">
      {/* Decorative Floating Game Background Blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-pink-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-cyan-400/15 blur-3xl" />

      {/* Confetti Cannon Overlay on Correct Answer OR Victory Screen */}
      {(celebratingCorrect || screen === 'VICTORY') && (
        <ConfettiCanvas
          burstKey={confettiBurstKey}
          continuous={screen === 'VICTORY'}
        />
      )}

      {/* ARCADE STAGE CURTAIN TRANSITION OVERLAY */}
      {transitionBanner.active && (
        <div
          className={`absolute inset-0 z-50 bg-gradient-to-br ${transitionBanner.color} flex flex-col items-center justify-center text-center p-6 animate-fadeIn`}
        >
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border-4 border-white flex items-center justify-center shadow-2xl animate-bounce mb-4">
            <img
              src="/assets/aistudio/B_LSEM_Junior_tilki_ikonu_e352f23b.png"
              alt="Fox"
              className="w-20 h-20 rounded-2xl object-cover"
            />
          </div>
          <div className="px-4 py-1 rounded-full bg-slate-950/30 text-white text-xs font-black tracking-widest uppercase mb-2">
            BİLSEM JUNIOR ARCADE
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.35)] tracking-tight">
            {transitionBanner.title}
          </h2>
          <p className="text-base sm:text-lg font-extrabold text-amber-100 mt-2 drop-shadow">
            {transitionBanner.subtitle}
          </p>
        </div>
      )}

      {/* TOP COLORFUL GAME HUD BAR */}
      <header className="relative z-10 px-4 sm:px-6 py-3.5 border-b-4 border-indigo-950/80 bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            onClick={() => {
              playSound('click');
              setScreen('TITLE');
            }}
            className="relative cursor-pointer group"
          >
            <img
              src="/assets/aistudio/B_LSEM_Junior_tilki_ikonu_e352f23b.png"
              alt="Fox"
              className="w-12 h-12 rounded-2xl object-cover border-3 border-amber-400 shadow-[0_4px_0_#b45309] group-hover:scale-105 transition"
            />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-400 border-2 border-indigo-950 text-[9px] font-black text-slate-950">
              IQ
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-white tracking-wide text-base sm:text-lg drop-shadow">
                FOX LOGIC
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black shadow-sm">
                BİLSEM JUNIOR
              </span>
            </div>
            <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
              <span>{currentLevel.worldName}</span>
            </div>
          </div>
        </div>

        {/* Right HUD Stats & Music Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-900/90 border-2 border-indigo-400/40 text-cyan-300 text-xs font-black shadow-[0_3px_0_#1e1b4b]">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>IQ {estimatedIQ}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-900/90 border-2 border-purple-400/40 text-pink-300 text-xs font-black shadow-[0_3px_0_#3b0764]">
            <Zap className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span>{xpPoints} XP</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 text-xs font-black shadow-[0_3px_0_#78350f]">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{totalStars} / 150</span>
          </div>

          {/* Interactive Music Track Switcher */}
          <button
            onClick={handleCycleMusicTrack}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-b from-pink-500 to-rose-600 border-2 border-pink-300 text-white text-xs font-black shadow-[0_3px_0_#881337] active:translate-y-0.5 cursor-pointer"
            title="Oyun Müziğini Değiştir"
          >
            <Music className="w-3.5 h-3.5" />
            <span>{MUSIC_TRACK_LABELS[musicTrack].name}</span>
          </button>

          <button
            onClick={() => {
              const nextState = !musicEnabled;
              setMusicEnabled(nextState);
              if (nextState) {
                const ctx = getAudioCtx();
                if (ctx) {
                  if (bgMusicRef.current) bgMusicRef.current.stop();
                  bgMusicRef.current = startBackgroundMusic(
                    ctx,
                    ctx.destination,
                    musicTrack,
                    70,
                    300
                  );
                }
              }
            }}
            className={`p-2 rounded-2xl border-2 transition cursor-pointer shadow-[0_3px_0_#1e1b4b] active:translate-y-0.5 ${
              musicEnabled
                ? 'bg-amber-400 border-amber-200 text-slate-950'
                : 'bg-indigo-900 border-indigo-700 text-indigo-400'
            }`}
            title="Müziği Aç / Kapat"
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-2xl border-2 transition cursor-pointer shadow-[0_3px_0_#1e1b4b] active:translate-y-0.5 ${
              soundEnabled
                ? 'bg-emerald-400 border-emerald-200 text-slate-950'
                : 'bg-indigo-900 border-indigo-700 text-indigo-400'
            }`}
            title="Ses Efektlerini Aç / Kapat"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <a
            href="/api/poki/download-zip"
            download="fox-logic-brain-quest-poki.zip"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-500 border-2 border-emerald-200 text-slate-950 text-xs font-black shadow-[0_3px_0_#065f46] active:translate-y-0.5 transition cursor-pointer"
            title="Poki İçin Hazır ZIP Paketini İndir"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Poki ZIP</span>
          </a>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* SCREEN 1: VIBRANT ARCADE TITLE MENU                                   */}
      {/* ===================================================================== */}
      {screen === 'TITLE' && (
        <div className="relative z-10 p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-7 min-h-[540px]">
          {/* Animated Hero Mascot Badge */}
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 rounded-full blur-2xl opacity-60 animate-pulse" />
            <div className="relative w-36 h-36 rounded-[32px] p-1.5 bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 shadow-[0_10px_0_#92400e] animate-bounce">
              <img
                src="/assets/aistudio/B_LSEM_Junior_tilki_ikonu_e352f23b.png"
                alt="Bilsem Junior Fox"
                className="w-full h-full rounded-[26px] object-cover"
              />
              <span className="absolute -top-3 -right-3 px-3 py-1 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 border-2 border-white text-xs font-black text-white shadow-lg rotate-12">
                50 BÖLÜM!
              </span>
            </div>
          </div>

          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border-2 border-amber-300/60 text-amber-200 text-xs font-black tracking-wide uppercase">
              🏆 Gerçek BİLSEM Junior Soru Motoru • Müzikli & Konfetili
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-[0_4px_0_rgba(0,0,0,0.4)]">
              FOX LOGIC:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300">
                BİLSEM QUEST
              </span>
            </h2>
            <p className="text-sm sm:text-base text-indigo-100 font-bold leading-relaxed">
              BİLSEM Junior uygulamasındaki gerçek 3×3 Raven Matrisleri, 3 Boyutlu Küp Kuleleri, Birleşik Gölge Analizi ve Kriptoloji Şifreleriyle beynini test et!
            </p>
          </div>

          {/* 4 Category Preview Cards (Clickable to jump right into that category!) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
            {[
              {
                lvl: 1,
                title: '3×3 Matris',
                sub: 'Örüntü & Yön',
                icon: Brain,
                bg: 'from-indigo-500 to-purple-600 border-indigo-300 shadow-[0_5px_0_#312e81]',
              },
              {
                lvl: 2,
                title: '3B Küp Kulesi',
                sub: 'Gizli Küp Sayma',
                icon: Layers,
                bg: 'from-sky-500 to-blue-600 border-sky-300 shadow-[0_5px_0_#1e3a8a]',
              },
              {
                lvl: 3,
                title: 'Birleşik Gölge',
                sub: 'Silüet & Açı',
                icon: Eye,
                bg: 'from-amber-400 to-orange-500 border-amber-200 text-slate-950 shadow-[0_5px_0_#9a3412]',
              },
              {
                lvl: 4,
                title: 'Kriptoloji',
                sub: 'Sembol Şifre',
                icon: KeyRound,
                bg: 'from-emerald-400 to-teal-600 border-emerald-200 text-slate-950 shadow-[0_5px_0_#065f46]',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.lvl}
                  onClick={() => handleStartLevel(item.lvl)}
                  className={`p-3.5 rounded-2xl bg-gradient-to-b ${item.bg} border-2 flex flex-col items-center text-center transition transform hover:-translate-y-1 active:translate-y-1 cursor-pointer`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <div className="text-xs font-black">{item.title}</div>
                  <div className="text-[10px] font-bold opacity-85">
                    {item.sub} (Bölüm {item.lvl})
                  </div>
                </button>
              );
            })}
          </div>

          {/* Big 3D Arcade Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg pt-1">
            <button
              onClick={() => {
                syncBackgroundMusic(true);
                runGameTransition(
                  'MAP',
                  'ZEKA HARİTASI 🗺️',
                  '50 BİLSEM Seviyesi Seni Bekliyor!',
                  'from-amber-400 via-orange-500 to-pink-500'
                );
              }}
              className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 border-2 border-yellow-200 text-slate-950 font-black text-lg shadow-[0_7px_0_#92400e] hover:brightness-105 active:translate-y-1.5 active:shadow-[0_2px_0_#92400e] transition-all cursor-pointer"
            >
              <Play className="w-6 h-6 fill-slate-950" />
              MACERAYA BAŞLA
            </button>

            <a
              href="/api/poki/download-zip"
              download="fox-logic-brain-quest-poki.zip"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-600 border-2 border-emerald-200 text-slate-950 font-black text-xs shadow-[0_7px_0_#064e3b] hover:brightness-105 active:translate-y-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              POKI ZIP İNDİR
            </a>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SCREEN 2: COLORFUL 50-LEVEL CANDY WORLD MAP                           */}
      {/* ===================================================================== */}
      {screen === 'MAP' && (
        <div className="relative z-10 p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-950/70 p-3.5 rounded-2xl border-2 border-indigo-400/30">
            <button
              onClick={() =>
                runGameTransition(
                  'TITLE',
                  'ANA MENÜ 🦊',
                  'Fox Logic: BİLSEM Quest'
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-700 border border-indigo-400/40 text-xs font-black text-white shadow-[0_3px_0_#1e1b4b] active:translate-y-0.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Ana Menü
            </button>

            <div className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>BİLSEM Junior • 50 Seviyelik Zeka Haritası</span>
            </div>

            <button
              onClick={handleUnlockAllLevels}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 border border-pink-300 text-xs font-black text-white shadow-[0_3px_0_#881337] active:translate-y-0.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              Tüm 50 Bölümü Aç
            </button>
          </div>

          {/* Category Legend */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-black">
            <span className="px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-300/50 text-indigo-200">
              🧩 Matris & Örüntü
            </span>
            <span className="px-3 py-1 rounded-full bg-sky-500/30 border border-sky-300/50 text-sky-200">
              🧊 3B Küp Sayma
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/30 border border-amber-300/50 text-amber-200">
              🕵️‍♂️ Birleşik Gölge
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-300/50 text-emerald-200">
              🔐 Kriptoloji Şifre
            </span>
          </div>

          {/* 50 Levels Candy Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 max-h-[430px] overflow-y-auto p-2 rounded-3xl bg-indigo-950/50 border-2 border-indigo-400/20">
            {ALL_50_BILSEM_LEVELS.map((lvl) => {
              const prog = progress[lvl.id] || { unlocked: false, stars: 0 };
              const isCurrent = currentLevelId === lvl.id;

              const catColor =
                lvl.category === 'matrix'
                  ? 'from-indigo-500 to-purple-600 border-indigo-300 shadow-[0_4px_0_#312e81]'
                  : lvl.category === 'cube3d'
                  ? 'from-sky-500 to-blue-600 border-sky-300 shadow-[0_4px_0_#1e3a8a]'
                  : lvl.category === 'shadow'
                  ? 'from-amber-400 to-orange-500 border-amber-200 text-slate-950 shadow-[0_4px_0_#9a3412]'
                  : 'from-emerald-400 to-teal-600 border-emerald-200 text-slate-950 shadow-[0_4px_0_#065f46]';

              return (
                <button
                  key={lvl.id}
                  disabled={!prog.unlocked}
                  onClick={() => handleStartLevel(lvl.id)}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${
                    !prog.unlocked
                      ? 'bg-indigo-950/60 border-indigo-800/60 text-indigo-500 opacity-55 cursor-not-allowed'
                      : isCurrent
                      ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 border-white text-slate-950 shadow-[0_5px_0_#92400e] scale-105 font-black cursor-pointer ring-4 ring-amber-300/40'
                      : `bg-gradient-to-b ${catColor} hover:scale-105 active:translate-y-1 font-black cursor-pointer`
                  }`}
                  title={`Bölüm ${lvl.id}: ${lvl.categoryLabel} (${lvl.puzzle.gradeLevel})`}
                >
                  {!prog.unlocked ? (
                    <Lock className="w-4 h-4 text-indigo-400/60" />
                  ) : (
                    <>
                      <span className="text-sm font-black leading-none">
                        {lvl.id}
                      </span>
                      <span className="text-[9px] font-extrabold opacity-80 mt-0.5">
                        {lvl.category === 'matrix'
                          ? 'MAT'
                          : lvl.category === 'cube3d'
                          ? 'KÜP'
                          : lvl.category === 'shadow'
                          ? 'GÖL'
                          : 'ŞİF'}
                      </span>
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: 3 }).map((_, s) => (
                          <Star
                            key={s}
                            className={`w-2.5 h-2.5 ${
                              s < prog.stars
                                ? 'text-yellow-300 fill-yellow-300 drop-shadow'
                                : 'text-black/30 fill-black/20'
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

      {/* ===================================================================== */}
      {/* SCREEN 3: ACTIVE GAMEPLAY (AUTHENTIC BİLSEM JUNIOR VISUAL STAGE)      */}
      {/* ===================================================================== */}
      {screen === 'PLAYING' && (
        <div className="relative z-10 p-4 sm:p-6 space-y-4">
          {/* Top Stage Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-950/80 px-4 py-2.5 rounded-2xl border-2 border-indigo-400/30">
            <button
              onClick={() => {
                poki.gameplayStop();
                runGameTransition(
                  'MAP',
                  'HARİTA 🗺️',
                  'Seviye Seçimine Dönülüyor'
                );
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-xs font-black text-white inline-flex items-center gap-1.5 shadow-[0_3px_0_#1e1b4b] active:translate-y-0.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Harita
            </button>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-black shadow-sm">
                BÖLÜM {currentLevelId} / 50
              </span>
              <span className="px-3 py-1 rounded-xl bg-indigo-800/90 border border-indigo-400/40 text-cyan-200 text-xs font-black">
                {puzzle.gradeLevel} • {puzzle.difficulty} •{' '}
                {currentLevel.subStyleLabel}
              </span>
              {streakCount >= 2 && (
                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black flex items-center gap-1 animate-bounce shadow">
                  <Flame className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                  {streakCount}x ALEV KOMBO!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`text-xs font-mono font-black px-3 py-1.5 rounded-xl border-2 shadow-[0_3px_0_#1e1b4b] ${
                  timeLeft <= 12
                    ? 'bg-rose-600 border-rose-300 text-white animate-pulse'
                    : 'bg-indigo-900 border-indigo-400/40 text-amber-300'
                }`}
              >
                ⏱️ {timeLeft} sn
              </div>

              <button
                onClick={handleUseHint}
                disabled={hintUsed}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition border-2 ${
                  hintUsed
                    ? 'bg-indigo-950 text-indigo-500 border-indigo-800 cursor-not-allowed'
                    : 'bg-gradient-to-b from-yellow-300 to-amber-500 border-white text-slate-950 shadow-[0_4px_0_#92400e] active:translate-y-0.5 cursor-pointer animate-pulse'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                {hintUsed ? 'İpucu Kullanıldı' : '💡 İpucu (2 Şık Ele)'}
              </button>
            </div>
          </div>

          {adMessage && (
            <div className="rounded-2xl bg-amber-400 text-slate-950 border-2 border-white p-3 text-center text-xs font-black shadow-lg animate-bounce">
              {adMessage}
            </div>
          )}

          {/* Question Prompt & Interactive Mascot Coach Bubble */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-indigo-950/90 via-purple-900/90 to-indigo-950/90 px-4 py-3 rounded-2xl border-2 border-amber-400/50 shadow-md">
            <div
              onClick={handleFoxClick}
              className="flex items-center gap-3 cursor-pointer group"
              title="Tilki Koça dokun, ipucu al!"
            >
              <div className="relative">
                <img
                  src="/assets/aistudio/B_LSEM_Junior_tilki_ikonu_e352f23b.png"
                  alt="Fox Coach"
                  className={`w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow group-hover:scale-110 active:scale-95 transition ${
                    celebratingCorrect ? 'animate-bounce' : ''
                  }`}
                />
                <span className="absolute -top-1 -right-1 text-xs">💬</span>
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-black text-white">
                  {puzzle.questionPrompt}
                </div>
                <div className="text-[11px] font-bold text-amber-300 group-hover:text-amber-200 transition">
                  {foxSpeech}
                </div>
              </div>
            </div>

            {/* Quick Level Skipper so user can test next BİLSEM question style immediately */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() =>
                  handleStartLevel(currentLevelId > 1 ? currentLevelId - 1 : 50)
                }
                className="px-2.5 py-1 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-[11px] font-black text-indigo-200 cursor-pointer"
                title="Önceki Soru"
              >
                ◀ Önceki
              </button>
              <button
                onClick={() =>
                  handleStartLevel(currentLevelId < 50 ? currentLevelId + 1 : 1)
                }
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-[11px] font-black text-slate-950 cursor-pointer"
                title="Sonraki Soru Tipini Gör"
              >
                Sonraki Soru ▶
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* BRIGHT BİLSEM JUNIOR 3D TILT PUZZLE STAGE CARD                     */}
          {/* ================================================================= */}
          <div
            onMouseMove={handleStageMouseMove}
            onMouseLeave={handleStageMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${stageTilt.rx}deg) rotateY(${stageTilt.ry}deg)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.12s ease-out',
            }}
            className={`relative max-w-xl mx-auto rounded-[28px] bg-[#FFFBEB] border-4 border-amber-400 shadow-[0_12px_0_#b45309] p-4 sm:p-6 min-h-[290px] flex items-center justify-center transition-all ${
              isWrongShake
                ? 'translate-x-3 border-rose-500 shadow-[0_12px_0_#9f1239]'
                : celebratingCorrect
                ? 'scale-[1.02] border-emerald-400 shadow-[0_12px_0_#059669]'
                : ''
            }`}
          >
            {/* XP Floater Badge when user scores */}
            {xpFloater && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 border-2 border-white text-slate-950 font-black text-sm shadow-xl animate-bounce">
                {xpFloater.text}
              </div>
            )}

            {/* Floating Celebration Popup inside Stage when Correct */}
            {celebratingCorrect && (
              <div className="absolute inset-0 z-20 bg-emerald-500/20 backdrop-blur-[2px] rounded-[24px] flex flex-col items-center justify-center animate-fadeIn">
                <div className="px-6 py-3 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 border-4 border-white text-white font-black text-2xl sm:text-3xl shadow-2xl animate-bounce">
                  🌟 SÜPER ZEKA! +{120 + streakCount * 30} XP! 🎉
                </div>
              </div>
            )}

            {/* 1. CATEGORY: 3x3 RAVEN MATRIX */}
            {puzzle.category === 'matrix' && puzzle.matrixSpec && (
              <div className="w-full max-w-[360px] aspect-square grid grid-cols-3 gap-2.5 sm:gap-3">
                {puzzle.matrixSpec.grid.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border-3 flex items-center justify-center p-2 transition-all ${
                      cell === null
                        ? 'bg-amber-100 border-dashed border-amber-500 text-amber-600 text-4xl font-black animate-pulse shadow-inner'
                        : 'bg-slate-100 border-slate-300 shadow-[0_4px_0_#cbd5e1]'
                    }`}
                  >
                    {cell ? renderMatrixCellFormation(cell, 34) : '?'}
                  </div>
                ))}
              </div>
            )}

            {/* 2. CATEGORY: 3D ISOMETRIC CUBE STACKING (Depth Sorted like canvasRenderer.ts) */}
            {puzzle.category === 'cube3d' && puzzle.cubeSpec && (
              <div className="w-full flex flex-col items-center justify-center">
                <svg
                  className="w-72 h-64 sm:w-80 sm:h-68 overflow-visible drop-shadow-md"
                  viewBox="-160 -150 320 260"
                >
                  {/* Soft 3D Ground Shadow */}
                  <ellipse cx="0" cy="85" rx="130" ry="24" fill="rgba(15, 23, 42, 0.18)" />

                  {[...puzzle.cubeSpec.cubes]
                    .sort(
                      (a: CubeCoord, b: CubeCoord) =>
                        a.x + a.y - (b.x + b.y) || a.z - b.z
                    )
                    .map((c, cIdx) => {
                      const size = 34;
                      const cos30 = Math.cos(Math.PI / 6) * size;
                      const sin30 = Math.sin(Math.PI / 6) * size;
                      const screenX = (c.x - c.y) * cos30;
                      const screenY = (c.x + c.y) * sin30 - c.z * size + 25;

                      return (
                        <React.Fragment key={cIdx}>
                          {render3DCube(
                            screenX,
                            screenY,
                            puzzle.cubeSpec?.paletteColor || '#3B82F6',
                            size
                          )}
                        </React.Fragment>
                      );
                    })}
                </svg>
                <div className="text-xs font-black text-slate-600 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-400">
                  💡 İpucu: Üstteki küplerin altında kalan görünmeyen küpleri de say!
                </div>
              </div>
            )}

            {/* 3. CATEGORY: COMPOSITE SHADOW & SILHOUETTE MATCHING */}
            {puzzle.category === 'shadow' && puzzle.shadowSpec && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 py-2">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-100 px-3 py-0.5 rounded-full border border-indigo-300">
                    HEDEF BİRLEŞİK ŞEKİL
                  </span>
                  <div className="w-40 h-40 rounded-3xl bg-white border-4 border-indigo-400 shadow-[0_6px_0_#818cf8] flex items-center justify-center">
                    {renderCompositeShadowFigure(
                      puzzle.shadowSpec.target.shape,
                      puzzle.shadowSpec.target.secondaryShape,
                      puzzle.shadowSpec.target.primaryColor,
                      puzzle.shadowSpec.target.secondaryColor,
                      puzzle.shadowSpec.target.rotation,
                      1,
                      false,
                      88
                    )}
                  </div>
                </div>

                <div className="text-3xl font-black text-amber-500 animate-pulse">
                  ➜
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200 px-3 py-0.5 rounded-full border border-amber-400">
                    DOĞRU GÖLGESİ HANGİSİ?
                  </span>
                  <div className="w-40 h-40 rounded-3xl bg-amber-100/80 border-4 border-dashed border-amber-500 flex flex-col items-center justify-center text-amber-600 shadow-inner">
                    <span className="text-5xl font-black animate-bounce">?</span>
                    <span className="text-[11px] font-extrabold mt-1">
                      Açı ve Parça Yönü
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CATEGORY: SYMBOL CRYPTOGRAPHY & CIPHER TABLE */}
            {puzzle.category === 'cipher' && puzzle.cipherSpec && (
              <div className="w-full max-w-md flex flex-col gap-2.5">
                {puzzle.cipherSpec.rows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className={`px-4 py-2.5 rounded-2xl border-3 flex items-center justify-between transition ${
                      row.isQuestionRow
                        ? 'bg-amber-100 border-amber-500 shadow-[0_4px_0_#d97706] animate-pulse'
                        : 'bg-white border-slate-300 shadow-[0_4px_0_#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {row.symbols.map((sym, sIdx) => (
                        <div
                          key={sIdx}
                          className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center"
                        >
                          {renderShapeSvg(
                            sym,
                            row.symbolColors[sIdx] || '#4F46E5',
                            0,
                            true,
                            false,
                            28
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-slate-400 font-black text-xl">➜</span>
                    <div
                      className={`px-3.5 py-1.5 rounded-xl font-mono font-black text-lg sm:text-xl tracking-wider ${
                        row.isQuestionRow
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-white'
                      }`}
                    >
                      {row.codeOutput}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* 4 COLORFUL 3D ARCADE OPTION CARDS (A, B, C, D)                    */}
          {/* ================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-2xl mx-auto pt-1">
            {(
              puzzle.matrixSpec?.options ||
              puzzle.cubeSpec?.options ||
              puzzle.shadowSpec?.options ||
              puzzle.cipherSpec?.options ||
              []
            ).map((opt: unknown, optIndex: number) => {
              const isEliminated = eliminatedOptions.includes(optIndex);
              const isSelected = selectedOptionIndex === optIndex;
              const isCorrect = optIndex === puzzle.correctOptionIndex;
              const letters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={optIndex}
                  disabled={isEliminated || selectedOptionIndex !== null}
                  onClick={() => handleSelectOption(optIndex)}
                  className={`group relative min-h-[124px] rounded-3xl border-4 flex flex-col items-center justify-between p-3 transition-all cursor-pointer ${
                    isEliminated
                      ? 'bg-slate-900/40 border-slate-700 opacity-25 cursor-not-allowed scale-95'
                      : isSelected && isCorrect
                      ? 'bg-emerald-100 border-emerald-400 shadow-[0_8px_0_#059669] scale-105 ring-4 ring-emerald-300'
                      : isSelected && !isCorrect
                      ? 'bg-rose-100 border-rose-500 shadow-[0_4px_0_#9f1239] translate-y-1'
                      : 'bg-white hover:bg-amber-50 border-indigo-200 hover:border-amber-400 shadow-[0_7px_0_#312e81] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#312e81]'
                  }`}
                >
                  {/* Top-Left Colorful 3D Letter Badge */}
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`w-8 h-8 rounded-xl bg-gradient-to-b ${OPTION_BADGE_COLORS[optIndex]} border text-white font-black text-sm flex items-center justify-center`}
                    >
                      {letters[optIndex]}
                    </span>
                    {isSelected && isCorrect && (
                      <span className="text-xs font-black text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded-full">
                        DOĞRU! ✓
                      </span>
                    )}
                    {isSelected && !isCorrect && (
                      <span className="text-xs font-black text-rose-700 bg-rose-200 px-2 py-0.5 rounded-full">
                        TEKRAR! ✗
                      </span>
                    )}
                  </div>

                  {/* Option Visual Content */}
                  <div className="w-full flex-1 flex items-center justify-center py-2">
                    {puzzle.category === 'matrix' && (
                      <div>
                        {renderMatrixCellFormation(opt as MatrixCellSpec, 32)}
                      </div>
                    )}

                    {puzzle.category === 'cube3d' && (
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
                          {String(opt)}
                        </span>
                        <span className="text-[11px] font-extrabold text-indigo-600 uppercase">
                          Birim Küp
                        </span>
                      </div>
                    )}

                    {puzzle.category === 'shadow' && (
                      <div>
                        {renderCompositeShadowFigure(
                          (opt as ShadowOptionSpec).shape,
                          (opt as ShadowOptionSpec).secondaryShape,
                          '#0F172A',
                          '#0F172A',
                          (opt as ShadowOptionSpec).rotation,
                          (opt as ShadowOptionSpec).offsetX ?? 1,
                          true,
                          54
                        )}
                      </div>
                    )}

                    {puzzle.category === 'cipher' && (
                      <span className="px-3 py-1.5 rounded-xl bg-indigo-950 text-amber-300 font-mono text-xl sm:text-2xl font-black tracking-wider shadow-inner">
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

      {/* ===================================================================== */}
      {/* SCREEN 4: CELEBRATORY VICTORY MODAL WITH CONFETTI & ANIMATED STARS    */}
      {/* ===================================================================== */}
      {screen === 'VICTORY' && (
        <div className="relative z-20 p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 min-h-[500px]">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 rounded-full blur-xl opacity-70 animate-pulse" />
            <img
              src="/assets/aistudio/B_LSEM_Junior_tilki_ikonu_e352f23b.png"
              alt="Fox Happy"
              className="relative w-28 h-28 rounded-[28px] object-cover border-4 border-amber-300 shadow-2xl animate-bounce"
            />
            <span className="absolute -top-4 -right-4 text-4xl drop-shadow">
              👑
            </span>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-emerald-400/20 border border-emerald-300 text-emerald-200 text-xs font-black">
              🎉 BÖLÜM {currentLevelId} TAMAMLANDI!
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">
              HARİKA ZEKA ÇÖZÜMÜ!
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 max-w-md font-bold bg-indigo-950/70 px-4 py-2.5 rounded-2xl border border-indigo-400/30">
              💡 {puzzle.explanation}
            </p>
          </div>

          {/* Animated 3 Stars */}
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, s) => {
              const currentStars = progress[currentLevelId]?.stars || 1;
              const hasStar = s < currentStars;

              return (
                <div
                  key={s}
                  className={`w-16 h-16 rounded-3xl flex items-center justify-center border-4 transition-all transform ${
                    hasStar
                      ? 'bg-gradient-to-b from-amber-300 to-orange-500 border-white scale-110 shadow-[0_6px_0_#92400e] animate-bounce'
                      : 'bg-indigo-950/60 border-indigo-800 opacity-40'
                  }`}
                  style={{ animationDelay: `${s * 120}ms` }}
                >
                  <Star
                    className={`w-9 h-9 ${
                      hasStar
                        ? 'text-white fill-white drop-shadow'
                        : 'text-indigo-600'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-black">
            <span className="px-4 py-2 rounded-2xl bg-indigo-950/80 border-2 border-cyan-400/50 text-cyan-300">
              🧠 Tahmini BİLSEM IQ: {estimatedIQ}
            </span>
            <span className="px-4 py-2 rounded-2xl bg-indigo-950/80 border-2 border-amber-400/50 text-amber-300">
              🔥 Seri Kombo: {streakCount}x
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
            <button
              onClick={() => handleStartLevel(currentLevelId)}
              className="px-6 py-4 rounded-2xl bg-indigo-800 hover:bg-indigo-700 border-2 border-indigo-400 text-white font-black text-xs inline-flex items-center justify-center gap-2 shadow-[0_5px_0_#1e1b4b] active:translate-y-1 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Tekrar Oyna
            </button>

            <button
              onClick={handleNextLevel}
              className="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-b from-emerald-400 via-teal-400 to-emerald-600 border-2 border-emerald-200 text-slate-950 font-black text-base inline-flex items-center justify-center gap-2 shadow-[0_6px_0_#064e3b] hover:brightness-105 active:translate-y-1 cursor-pointer"
            >
              <span>SONRAKİ BÖLÜM ({currentLevelId + 1})</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SCREEN 5: GAME OVER (TIME UP)                                         */}
      {/* ===================================================================== */}
      {screen === 'GAME_OVER' && (
        <div className="relative z-20 p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[480px]">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-4 border-rose-400 flex items-center justify-center text-4xl animate-bounce">
            ⏰
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">SÜRE DOLDU!</h2>
            <p className="text-sm text-indigo-200 max-w-sm font-bold">
              BİLSEM sorularında dikkat kadar hız da önemlidir. Hemen tekrar dene!
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                runGameTransition('MAP', 'HARİTA 🗺️', 'Seviye Seçimi')
              }
              className="px-6 py-3.5 rounded-2xl bg-indigo-800 border-2 border-indigo-400 text-white font-black text-xs shadow-[0_4px_0_#1e1b4b] cursor-pointer"
            >
              Haritaya Dön
            </button>
            <button
              onClick={() => handleStartLevel(currentLevelId)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 border-2 border-white text-slate-950 font-black text-sm shadow-[0_5px_0_#92400e] cursor-pointer"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoxLogicPokiGame;
