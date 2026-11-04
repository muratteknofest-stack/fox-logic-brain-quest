import { BilsemPuzzle, PuzzleCategory, GradeLevel, DifficultyLevel } from '../types/puzzle';
import { generateProceduralBilsemPuzzle } from '../utils/proceduralGenerator';
import { INITIAL_PUZZLES } from '../data/defaultPuzzles';

export interface PokiBilsemLevel {
  id: number;
  worldNumber: number; // 1 to 5
  worldName: string;
  worldThemeColor: string;
  category: PuzzleCategory;
  categoryLabel: string;
  subStyleLabel: string;
  puzzle: BilsemPuzzle;
}

export function generate50BilsemLevels(): PokiBilsemLevel[] {
  const levels: PokiBilsemLevel[] = [];

  const categories: PuzzleCategory[] = [
    'matrix',
    'cube3d',
    'shadow',
    'cipher',
  ];

  const worldMeta = [
    {
      name: 'Orman Akademisi (BİLSEM 1-2. Sınıf Karma)',
      color: '#10B981',
    },
    {
      name: 'İzometrik Kanyon (Uzamsal & Küp Zekası)',
      color: '#3B82F6',
    },
    {
      name: 'Gölge & Ayna Vadisi (Görsel Algı)',
      color: '#8B5CF6',
    },
    {
      name: 'Kriptoloji Kalesi (Şifre & Mantık)',
      color: '#F59E0B',
    },
    {
      name: 'Mensa Zirvesi (3. Sınıf Üstün Yetenek)',
      color: '#EC4899',
    },
  ];

  const categoryNames: Record<PuzzleCategory, string> = {
    matrix: '3×3 Raven Matris & Örüntü',
    cube3d: '3B Küp Sayma & Uzamsal Algı',
    shadow: 'Birleşik Gölge & Açı Analizi',
    cipher: 'Kriptoloji & Sembol Şifreleme',
  };

  for (let lvl = 1; lvl <= 50; lvl++) {
    const worldIndex = Math.min(4, Math.floor((lvl - 1) / 10));
    const world = worldMeta[worldIndex];

    // Rotate all 4 authentic BİLSEM Junior categories continuously so the player
    // immediately experiences Matrix, 3D Cubes, Shadow/Silhouette, and Cipher!
    const cat: PuzzleCategory = categories[(lvl - 1) % categories.length];

    // Make difficulty genuinely engaging (start at Orta/Zor BİLSEM standard)
    const grade: GradeLevel =
      lvl <= 8 ? '2. Sınıf' : lvl <= 24 ? '2. Sınıf' : '3. Sınıf';
    const diff: DifficultyLevel =
      lvl <= 4 ? 'Orta' : lvl % 2 === 0 ? 'Zor' : 'Orta';

    let puzzle: BilsemPuzzle;

    // Levels 1-4 use the 4 signature hand-crafted BİLSEM Junior puzzles directly
    if (lvl <= 4 && INITIAL_PUZZLES[lvl - 1]) {
      puzzle = {
        ...INITIAL_PUZZLES[lvl - 1],
        id: `poki-bilsem-lvl-${lvl}`,
      };
    } else {
      const styleSeed = (lvl - 1) % 3;
      puzzle = generateProceduralBilsemPuzzle(cat, grade, diff, styleSeed);
      puzzle.id = `poki-bilsem-lvl-${lvl}`;
    }

    levels.push({
      id: lvl,
      worldNumber: worldIndex + 1,
      worldName: world.name,
      worldThemeColor: world.color,
      category: puzzle.category,
      categoryLabel: categoryNames[puzzle.category],
      subStyleLabel: puzzle.subStyleLabel || categoryNames[puzzle.category],
      puzzle,
    });
  }

  return levels;
}

export const ALL_50_BILSEM_LEVELS = generate50BilsemLevels();
