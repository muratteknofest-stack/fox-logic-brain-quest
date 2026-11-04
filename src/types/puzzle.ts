export type PuzzleCategory = 'matrix' | 'cube3d' | 'shadow' | 'cipher';

export type GradeLevel = '1. Sınıf' | '2. Sınıf' | '3. Sınıf';
export type DifficultyLevel = 'Kolay' | 'Orta' | 'Zor';

export type ReelThemeId =
  | 'space_academy'
  | 'neon_quiz'
  | 'playful_pop'
  | 'classic_bilsem';

export type MusicTrackId =
  | 'quiz_show'
  | 'playful_marimba'
  | 'lofi_focus'
  | 'cosmic_synth'
  | 'custom_mp3'
  | 'none';

export type ShapeType =
  | 'circle'
  | 'triangle'
  | 'square'
  | 'diamond'
  | 'star'
  | 'hexagon'
  | 'pentagon'
  | 'cross';

export interface MatrixCellSpec {
  shape: ShapeType;
  color: string;
  rotation: number; // degrees: 0, 45, 90, 135, 180, 270
  count: number; // 1 to 4
  innerDot?: boolean;
  filled?: boolean;
}

export interface MatrixVisualSpec {
  grid: (MatrixCellSpec | null)[]; // 9 cells (index 8 is null for '?')
  options: MatrixCellSpec[]; // 4 options (A, B, C, D)
}

export interface CubeCoord {
  x: number; // 0..3
  y: number; // 0..3
  z: number; // 0..3 (height)
  color?: string;
}

export interface Cube3DVisualSpec {
  cubes: CubeCoord[];
  paletteColor: string;
  options: number[]; // 4 numeric cube counts for A, B, C, D
}

export interface ShadowOptionSpec {
  shape: ShapeType;
  secondaryShape?: ShapeType;
  rotation: number;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  isShadow: boolean;
}

export interface ShadowVisualSpec {
  mode: 'shadow' | 'reflection' | 'piece';
  target: {
    shape: ShapeType;
    secondaryShape: ShapeType;
    primaryColor: string;
    secondaryColor: string;
    rotation: number;
  };
  options: ShadowOptionSpec[]; // 4 options (A, B, C, D)
}

export interface CipherRowSpec {
  symbols: ShapeType[];
  symbolColors: string[];
  codeOutput: string; // e.g. "4 7 2"
  isQuestionRow?: boolean;
}

export interface CipherVisualSpec {
  rows: CipherRowSpec[]; // 3 clue rows + 1 question row
  options: string[]; // 4 code strings for A, B, C, D
}

export interface BilsemPuzzle {
  id: string;
  title: string;
  category: PuzzleCategory;
  gradeLevel: GradeLevel;
  difficulty: DifficultyLevel;
  questionPrompt: string;
  correctOptionIndex: number; // 0=A, 1=B, 2=C, 3=D
  explanation: string;
  voiceoverQuestion: string;
  voiceoverAnswer: string;
  caption: string;
  hashtags: string[];
  matrixSpec?: MatrixVisualSpec;
  cubeSpec?: Cube3DVisualSpec;
  shadowSpec?: ShadowVisualSpec;
  cipherSpec?: CipherVisualSpec;
  subStyleLabel?: string;
  createdAt: string;
}

export type ScheduleStatus = 'Hazır' | 'Sırada' | 'Yayınlandı' | 'Hata';

export interface ScheduledReelItem {
  id: string;
  dayNumber?: number;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: ScheduleStatus;
  puzzle: BilsemPuzzle;
  themeId?: ReelThemeId;
  musicTrack?: MusicTrackId;
  instagramMediaId?: string;
  permalink?: string;
  errorMessage?: string;
  videoUploadedId?: string;
}

export interface InstagramAutomationConfig {
  igUserId: string;
  accessToken: string;
  accountHandle: string;
  metaAppId?: string;
  metaAppSecret?: string;
  dailyPublishTime: string; // e.g. "18:00"
  autoPublishEnabled: boolean;
  countdownSeconds: number; // default 5
  voiceName: 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir';
  includeExplanationSlide: boolean;
  themeId: ReelThemeId;
  musicTrack: MusicTrackId;
  musicVolume: number; // 0 to 100
  showMascot: boolean;
  showSubtitles: boolean;
}
