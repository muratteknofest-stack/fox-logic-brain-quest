export interface GameCard {
  shape: 'star' | 'circle' | 'square' | 'triangle' | 'diamond' | 'arrow' | 'pentagon' | 'hexagon';
  innerShape?: 'circle' | 'diamond' | 'dot' | 'cross' | 'square';
  innerDot?: boolean;
  count: number;
  color: string;
  innerColor?: string;
  rotation: number; // degrees (0, 45, 90, 135, 180, 270)
  filled: boolean;
  striped?: boolean;
}

export interface GameOption extends GameCard {
  id: string; // 'A' | 'B' | 'C' | 'D'
}

export interface PokiLevel {
  id: number;
  world: number; // 1 to 5
  worldName: string;
  gridSize: 2 | 3; // 2x2 (4 cells) or 3x3 (9 cells)
  ruleName: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  cards: (GameCard | null)[];
  options: GameOption[];
  correctId: string;
  hintExplanation: string;
}

const SHAPES: GameCard['shape'][] = [
  'square',
  'triangle',
  'circle',
  'diamond',
  'pentagon',
  'hexagon',
  'star',
  'arrow',
];

const PALETTES = [
  { primary: '#3B82F6', secondary: '#93C5FD', accent: '#1D4ED8' }, // Sapphire
  { primary: '#F59E0B', secondary: '#FDE68A', accent: '#B45309' }, // Amber
  { primary: '#10B981', secondary: '#A7F3D0', accent: '#047857' }, // Emerald
  { primary: '#8B5CF6', secondary: '#DDD6FE', accent: '#6D28D9' }, // Amethyst
  { primary: '#EC4899', secondary: '#FBCFE8', accent: '#BE185D' }, // Rose
  { primary: '#06B6D4', secondary: '#A5F3FC', accent: '#0E7490' }, // Cyan
];

const WORLDS = [
  { id: 1, name: 'Apprentice Valley', description: 'Dual-Attribute Analogies' },
  { id: 2, name: 'Concentric Meadow', description: 'Nested Shapes & Inversion' },
  { id: 3, name: 'Reflection Ridge', description: 'Symmetry & Angular Vectors' },
  { id: 4, name: 'Raven 3×3 Citadel', description: 'Advanced Matrix Induction' },
  { id: 5, name: 'Mensa Apex Fortress', description: 'Compound Set Logic & XOR' },
];

export function generateChallengingPokiLevels(): PokiLevel[] {
  const levels: PokiLevel[] = [];

  for (let lvl = 1; lvl <= 50; lvl++) {
    const worldIndex = Math.min(4, Math.floor((lvl - 1) / 10));
    const worldInfo = WORLDS[worldIndex];
    const difficulty = (1 + Math.min(4, Math.floor((lvl - 1) / 10))) as 1 | 2 | 3 | 4 | 5;

    // Levels 1-20 are 2x2 grid (challenging compound analogies)
    // Levels 21-50 are genuine 3x3 Raven Progressive Matrices (9 cells)
    const gridSize: 2 | 3 = lvl >= 21 ? 3 : 2;

    const pal = PALETTES[(lvl * 2) % PALETTES.length];
    const s1 = SHAPES[(lvl * 3) % SHAPES.length];
    const s2 = SHAPES[(lvl * 3 + 1) % SHAPES.length];
    const s3 = SHAPES[(lvl * 3 + 2) % SHAPES.length];

    if (gridSize === 2) {
      // 2x2 Grid: Compound Logic (Shape + Nested Element + Rotation + Fill)
      let c1: GameCard;
      let c2: GameCard;
      let c3: GameCard;
      let correct: GameOption;
      let optA: GameOption;
      let optB: GameOption;
      let optC: GameOption;
      let optD: GameOption;
      let ruleName = '';
      let hint = '';

      if (worldIndex === 0) {
        // World 1: Dual-Attribute (Shape rotation + Inner Dot toggling)
        ruleName = 'Rotation & Dot Induction';
        c1 = { shape: s1, count: 1, color: pal.primary, rotation: 0, filled: true, innerDot: false };
        c2 = { shape: s1, count: 1, color: pal.primary, rotation: 90, filled: true, innerDot: true };
        c3 = { shape: s2, count: 1, color: pal.accent, rotation: 0, filled: true, innerDot: false };
        correct = { id: 'B', shape: s2, count: 1, color: pal.accent, rotation: 90, filled: true, innerDot: true };

        // Deceptive distractors
        optA = { id: 'A', shape: s2, count: 1, color: pal.accent, rotation: 90, filled: true, innerDot: false }; // missing dot
        optB = correct;
        optC = { id: 'C', shape: s2, count: 1, color: pal.accent, rotation: 180, filled: true, innerDot: true }; // wrong rotation
        optD = { id: 'D', shape: s1, count: 1, color: pal.primary, rotation: 90, filled: true, innerDot: true }; // wrong shape
        hint = 'Rule: Rotate 90° clockwise and activate the center core dot!';
      } else {
        // World 2: Concentric Nested Shapes (Outer shape stays, inner shape rotates & inverts fill)
        ruleName = 'Concentric Shape Inversion';
        c1 = { shape: s1, innerShape: 'circle', count: 1, color: pal.primary, innerColor: pal.secondary, rotation: 0, filled: true };
        c2 = { shape: s1, innerShape: 'diamond', count: 1, color: pal.primary, innerColor: pal.secondary, rotation: 45, filled: false };
        c3 = { shape: s2, innerShape: 'circle', count: 1, color: pal.accent, innerColor: pal.secondary, rotation: 0, filled: true };
        correct = { id: 'C', shape: s2, innerShape: 'diamond', count: 1, color: pal.accent, innerColor: pal.secondary, rotation: 45, filled: false };

        optA = { id: 'A', shape: s2, innerShape: 'circle', count: 1, color: pal.accent, innerColor: pal.secondary, rotation: 45, filled: false };
        optB = { id: 'B', shape: s2, innerShape: 'diamond', count: 1, color: pal.accent, innerColor: pal.secondary, rotation: 0, filled: true };
        optC = correct;
        optD = { id: 'D', shape: s1, innerShape: 'diamond', count: 1, color: pal.primary, innerColor: pal.secondary, rotation: 45, filled: false };
        hint = 'Rule: Outer shape stays; inner circle becomes diamond, rotates 45° and inverts to outline!';
      }

      levels.push({
        id: lvl,
        world: worldInfo.id,
        worldName: worldInfo.name,
        gridSize: 2,
        ruleName,
        difficulty,
        cards: [c1, c2, c3, null],
        options: [optA, optB, optC, optD],
        correctId: correct.id,
        hintExplanation: hint,
      });
    } else {
      // 3x3 Raven Progressive Matrix (9 cells: 8 given + 1 missing at bottom right)
      // Genuine row-by-column transformation rules!
      const cards: (GameCard | null)[] = [];
      let ruleName = '';
      let hint = '';

      if (worldIndex === 2) {
        // World 3: 3x3 Progressive Angles (Rows have shape identity, Columns advance angle by 45°)
        ruleName = '3×3 Vectorial Angular Shift';
        const shapesInRows = [s1, s2, s3];
        const angles = [0, 45, 90];

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (r === 2 && c === 2) {
              cards.push(null); // Question mark
            } else {
              cards.push({
                shape: shapesInRows[r],
                count: 1,
                color: pal.primary,
                rotation: angles[c],
                filled: r === 1 ? false : true,
                innerDot: c === 1,
              });
            }
          }
        }

        const correct: GameOption = {
          id: 'A',
          shape: s3,
          count: 1,
          color: pal.primary,
          rotation: 90,
          filled: true,
          innerDot: false,
        };
        const optA = correct;
        const optB: GameOption = { id: 'B', shape: s3, count: 1, color: pal.primary, rotation: 45, filled: true, innerDot: false }; // wrong angle
        const optC: GameOption = { id: 'C', shape: s3, count: 1, color: pal.primary, rotation: 90, filled: false, innerDot: false }; // wrong fill
        const optD: GameOption = { id: 'D', shape: s2, count: 1, color: pal.primary, rotation: 90, filled: true, innerDot: false }; // wrong shape

        hint = 'Matrix Rule: Row 3 requires shape 3 (solid). Column 3 requires 90° angle without dot!';
        levels.push({
          id: lvl,
          world: worldInfo.id,
          worldName: worldInfo.name,
          gridSize: 3,
          ruleName,
          difficulty,
          cards,
          options: [optA, optB, optC, optD],
          correctId: 'A',
          hintExplanation: hint,
        });
      } else if (worldIndex === 3) {
        // World 4: 3x3 Arithmetic Progression (Counts 1, 2, 3 across rows; colors cross columns)
        ruleName = '3×3 Multi-Attribute Progression';
        const shapesArr = [s1, s2, s3];
        const colorsArr = [pal.primary, pal.secondary, pal.accent];

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (r === 2 && c === 2) {
              cards.push(null);
            } else {
              cards.push({
                shape: shapesArr[r],
                count: c + 1,
                color: colorsArr[c],
                rotation: r * 45,
                filled: true,
              });
            }
          }
        }

        const correct: GameOption = {
          id: 'C',
          shape: s3,
          count: 3,
          color: colorsArr[2],
          rotation: 90,
          filled: true,
        };

        const optA: GameOption = { id: 'A', shape: s3, count: 2, color: colorsArr[2], rotation: 90, filled: true }; // wrong count
        const optB: GameOption = { id: 'B', shape: s2, count: 3, color: colorsArr[2], rotation: 90, filled: true }; // wrong shape
        const optC = correct;
        const optD: GameOption = { id: 'D', shape: s3, count: 3, color: colorsArr[0], rotation: 90, filled: true }; // wrong color

        hint = 'Matrix Rule: Row 3 has 90° rotation. Column 3 has count 3 and accent color!';
        levels.push({
          id: lvl,
          world: worldInfo.id,
          worldName: worldInfo.name,
          gridSize: 3,
          ruleName,
          difficulty,
          cards,
          options: [optA, optB, optC, optD],
          correctId: 'C',
          hintExplanation: hint,
        });
      } else {
        // World 5: Mensa Apex Fortress (XOR / Nested Shape Transformation)
        ruleName = 'Compound Mensa Set Deduction';
        const outerShapes = [s1, s2, s3];
        const innerItems: ('circle' | 'diamond' | 'cross')[] = ['circle', 'diamond', 'cross'];

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (r === 2 && c === 2) {
              cards.push(null);
            } else {
              cards.push({
                shape: outerShapes[r],
                innerShape: innerItems[c],
                count: 1,
                color: pal.primary,
                innerColor: pal.accent,
                rotation: (r + c) * 45,
                filled: (r + c) % 2 === 0,
              });
            }
          }
        }

        // r=2, c=2 => rotation = (2+2)*45 = 180 deg, filled = (2+2)%2===0 -> true, outer=s3, inner=cross
        const correct: GameOption = {
          id: 'D',
          shape: s3,
          innerShape: 'cross',
          count: 1,
          color: pal.primary,
          innerColor: pal.accent,
          rotation: 180,
          filled: true,
        };

        const optA: GameOption = { id: 'A', shape: s3, innerShape: 'circle', count: 1, color: pal.primary, innerColor: pal.accent, rotation: 180, filled: true };
        const optB: GameOption = { id: 'B', shape: s3, innerShape: 'cross', count: 1, color: pal.primary, innerColor: pal.accent, rotation: 135, filled: true };
        const optC: GameOption = { id: 'C', shape: s2, innerShape: 'cross', count: 1, color: pal.primary, innerColor: pal.accent, rotation: 180, filled: false };
        const optD = correct;

        hint = 'Mensa Deduction: Outer shape follows Row 3 (Shape 3). Inner shape follows Column 3 (Cross). Rotation is 180° with solid fill!';
        levels.push({
          id: lvl,
          world: worldInfo.id,
          worldName: worldInfo.name,
          gridSize: 3,
          ruleName,
          difficulty,
          cards,
          options: [optA, optB, optC, optD],
          correctId: 'D',
          hintExplanation: hint,
        });
      }
    }
  }

  return levels;
}

export const ALL_POKI_LEVELS = generateChallengingPokiLevels();
