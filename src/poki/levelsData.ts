export interface GameCard {
  shape: 'star' | 'circle' | 'square' | 'triangle' | 'diamond' | 'arrow' | 'pentagon' | 'hexagon';
  count: number;
  color: string;
  rotation: number; // in degrees
  filled: boolean;
}

export interface GameOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  shape: 'star' | 'circle' | 'square' | 'triangle' | 'diamond' | 'arrow' | 'pentagon' | 'hexagon';
  count: number;
  color: string;
  rotation: number;
  filled: boolean;
}

export interface PokiLevel {
  id: number;
  world: number; // 1 to 5 worlds
  category: 'analogy' | 'matrix' | 'pattern' | 'rotation' | 'classification';
  difficulty: 1 | 2 | 3 | 4 | 5;
  cards: (GameCard | null)[]; // 4 cells: [card1, card2, card3, null]
  options: GameOption[];
  correctId: string;
  hintExplanation: string;
}

const SHAPES: GameCard['shape'][] = [
  'star',
  'circle',
  'square',
  'triangle',
  'diamond',
  'arrow',
  'pentagon',
  'hexagon',
];

const PALETTES = [
  ['#3B82F6', '#60A5FA'], // Blues
  ['#F59E0B', '#FBBF24'], // Ambers
  ['#10B981', '#34D399'], // Emeralds
  ['#8B5CF6', '#A78BFA'], // Purples
  ['#EC4899', '#F472B6'], // Pinks
  ['#06B6D4', '#22D3EE'], // Cyans
];

export function generatePokiLevels(): PokiLevel[] {
  const levels: PokiLevel[] = [];

  for (let lvl = 1; lvl <= 50; lvl++) {
    const world = Math.ceil(lvl / 10);
    const difficulty = (1 + Math.min(4, Math.floor((lvl - 1) / 10))) as 1 | 2 | 3 | 4 | 5;
    const catIndex = (lvl - 1) % 5;
    const categories: PokiLevel['category'][] = [
      'analogy',
      'matrix',
      'pattern',
      'rotation',
      'classification',
    ];
    const category = categories[catIndex];

    const sIdx1 = (lvl * 3) % SHAPES.length;
    const sIdx2 = (lvl * 3 + 2) % SHAPES.length;
    const shape1 = SHAPES[sIdx1];
    const shape2 = SHAPES[sIdx2];

    const palette = PALETTES[lvl % PALETTES.length];
    const color1 = palette[0];
    const color2 = palette[1];

    let c1: GameCard;
    let c2: GameCard;
    let c3: GameCard;
    let correct: GameOption;
    let optA: GameOption;
    let optB: GameOption;
    let optC: GameOption;
    let optD: GameOption;
    let hint = '';

    if (category === 'analogy') {
      // Shape1 count 1 -> Shape1 count 2
      // Shape2 count 1 -> Shape2 count 2
      c1 = { shape: shape1, count: 1, color: color1, rotation: 0, filled: true };
      c2 = { shape: shape1, count: 2, color: color1, rotation: 0, filled: true };
      c3 = { shape: shape2, count: 1, color: color2, rotation: 0, filled: true };
      correct = { id: 'B', shape: shape2, count: 2, color: color2, rotation: 0, filled: true };
      optA = { id: 'A', shape: shape2, count: 1, color: color2, rotation: 90, filled: false };
      optB = correct;
      optC = { id: 'C', shape: shape1, count: 2, color: color1, rotation: 0, filled: true };
      optD = { id: 'D', shape: shape2, count: 3, color: color2, rotation: 0, filled: true };
      hint = 'Count rule: The item doubles in quantity!';
    } else if (category === 'rotation') {
      // Rotation: 0 deg -> 90 deg, then 180 deg -> 270 deg
      c1 = { shape: shape1, count: 1, color: color1, rotation: 0, filled: true };
      c2 = { shape: shape1, count: 1, color: color1, rotation: 90, filled: true };
      c3 = { shape: shape2, count: 1, color: color2, rotation: 180, filled: true };
      correct = { id: 'C', shape: shape2, count: 1, color: color2, rotation: 270, filled: true };
      optA = { id: 'A', shape: shape2, count: 1, color: color2, rotation: 0, filled: true };
      optB = { id: 'B', shape: shape1, count: 1, color: color1, rotation: 270, filled: true };
      optC = correct;
      optD = { id: 'D', shape: shape2, count: 2, color: color2, rotation: 180, filled: false };
      hint = 'Angle rule: The shape rotates 90 degrees clockwise!';
    } else if (category === 'pattern') {
      // Sequence: 1, 2, 3 -> next is 4
      c1 = { shape: shape1, count: 1, color: color1, rotation: 0, filled: true };
      c2 = { shape: shape1, count: 2, color: color1, rotation: 0, filled: true };
      c3 = { shape: shape1, count: 3, color: color1, rotation: 0, filled: true };
      correct = { id: 'A', shape: shape1, count: 4, color: color1, rotation: 0, filled: true };
      optA = correct;
      optB = { id: 'B', shape: shape2, count: 4, color: color2, rotation: 0, filled: true };
      optC = { id: 'C', shape: shape1, count: 2, color: color1, rotation: 90, filled: true };
      optD = { id: 'D', shape: shape1, count: 5, color: color1, rotation: 0, filled: false };
      hint = 'Sequence rule: Number of symbols increases by 1!';
    } else if (category === 'classification') {
      // Filled vs outlined
      c1 = { shape: shape1, count: 2, color: color1, rotation: 0, filled: true };
      c2 = { shape: shape1, count: 2, color: color1, rotation: 0, filled: false };
      c3 = { shape: shape2, count: 2, color: color2, rotation: 0, filled: true };
      correct = { id: 'D', shape: shape2, count: 2, color: color2, rotation: 0, filled: false };
      optA = { id: 'A', shape: shape2, count: 2, color: color2, rotation: 0, filled: true };
      optB = { id: 'B', shape: shape1, count: 2, color: color1, rotation: 90, filled: false };
      optC = { id: 'C', shape: shape2, count: 3, color: color2, rotation: 0, filled: false };
      optD = correct;
      hint = 'Style rule: Solid filled item transforms into outline!';
    } else {
      // Matrix: Shape and color cross-matching
      c1 = { shape: shape1, count: 1, color: color1, rotation: 0, filled: true };
      c2 = { shape: shape2, count: 1, color: color1, rotation: 0, filled: true };
      c3 = { shape: shape1, count: 1, color: color2, rotation: 0, filled: true };
      correct = { id: 'B', shape: shape2, count: 1, color: color2, rotation: 0, filled: true };
      optA = { id: 'A', shape: shape1, count: 1, color: color2, rotation: 0, filled: true };
      optB = correct;
      optC = { id: 'C', shape: shape2, count: 2, color: color1, rotation: 0, filled: true };
      optD = { id: 'D', shape: shape2, count: 1, color: color2, rotation: 90, filled: false };
      hint = 'Matrix rule: Cross match shape with the column color!';
    }

    levels.push({
      id: lvl,
      world,
      category,
      difficulty,
      cards: [c1, c2, c3, null],
      options: [optA, optB, optC, optD],
      correctId: correct.id,
      hintExplanation: hint,
    });
  }

  return levels;
}

export const ALL_POKI_LEVELS = generatePokiLevels();
