import { BilsemPuzzle } from '../types/puzzle';
import { generateProceduralBilsemPuzzle } from '../utils/proceduralGenerator';
import { INITIAL_PUZZLES } from '../data/defaultPuzzles';

export interface PokiBilsemLevel {
  id: number;
  worldNumber: number; // 1 to 5
  worldName: string;
  category: 'matrix' | 'cube3d' | 'shadow' | 'cipher';
  categoryLabel: string;
  puzzle: BilsemPuzzle;
}

export function generate50BilsemLevels(): PokiBilsemLevel[] {
  const levels: PokiBilsemLevel[] = [];

  const categories: ('matrix' | 'cube3d' | 'shadow' | 'cipher')[] = [
    'matrix',
    'cube3d',
    'shadow',
    'cipher',
  ];

  const worldTitles = [
    'Forest Academy (1. Sınıf Temel Zeka)',
    'Isometric Mountain (3B Küp Algısı)',
    'Shadow Valley (Gölge & Simetri)',
    'Cipher Dungeon (Şifre & Kodlama)',
    'Mensa Citadel (3. Sınıf Üstün Yetenek)',
  ];

  for (let lvl = 1; lvl <= 50; lvl++) {
    const worldIndex = Math.min(4, Math.floor((lvl - 1) / 10));
    const worldName = worldTitles[worldIndex];

    let cat: 'matrix' | 'cube3d' | 'shadow' | 'cipher';
    if (lvl <= 12) {
      cat = 'matrix';
    } else if (lvl <= 24) {
      cat = 'cube3d';
    } else if (lvl <= 36) {
      cat = 'shadow';
    } else {
      cat = lvl % 2 === 0 ? 'cipher' : 'matrix';
    }

    const grade = lvl <= 15 ? '1. Sınıf' : lvl <= 35 ? '2. Sınıf' : '3. Sınıf';
    const diff = lvl % 3 === 1 ? 'Kolay' : lvl % 3 === 2 ? 'Orta' : 'Zor';

    // Seeded/deterministic selection
    let puzzle: BilsemPuzzle;
    const initialMatch = INITIAL_PUZZLES.find((p) => p.category === cat);
    if (lvl === 1 && initialMatch) {
      puzzle = initialMatch;
    } else {
      puzzle = generateProceduralBilsemPuzzle(cat, grade, diff);
      puzzle.id = `poki-level-${lvl}`;
    }

    const categoryNames: Record<string, string> = {
      matrix: 'Görsel Matris & Örüntü',
      cube3d: '3B Küp Sayma & Uzamsal',
      shadow: 'Gölge, Yansıma & Simetri',
      cipher: 'Şifreleme & Sembol Mantığı',
    };

    levels.push({
      id: lvl,
      worldNumber: worldIndex + 1,
      worldName,
      category: cat,
      categoryLabel: categoryNames[cat] || 'Zeka Sorusu',
      puzzle,
    });
  }

  return levels;
}

export const ALL_50_BILSEM_LEVELS = generate50BilsemLevels();
