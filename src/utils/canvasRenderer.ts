import {
  BilsemPuzzle,
  ReelThemeId,
  ShapeType,
  MatrixCellSpec,
  CubeCoord,
} from '../types/puzzle';

export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;

export const REEL_THEME_CONFIGS: Record<
  ReelThemeId,
  {
    name: string;
    bgTop: string;
    bgBottom: string;
    cardBg: string;
    cardBorder: string;
    accent: string;
    badgeBg: string;
    slabBevel: string;
  }
> = {
  space_academy: {
    name: 'Uzay Akademisi',
    bgTop: '#0B1026',
    bgBottom: '#1B1447',
    cardBg: '#FFFFFF',
    cardBorder: '#6366F1',
    accent: '#F59E0B',
    badgeBg: '#312E81',
    slabBevel: '#4338CA',
  },
  neon_quiz: {
    name: 'Neon Yarışma',
    bgTop: '#090D16',
    bgBottom: '#111827',
    cardBg: '#F8FAFC',
    cardBorder: '#06B6D4',
    accent: '#EC4899',
    badgeBg: '#0E7490',
    slabBevel: '#0891B2',
  },
  playful_pop: {
    name: 'Oyun Odası',
    bgTop: '#1E1B4B',
    bgBottom: '#311042',
    cardBg: '#FFFBEB',
    cardBorder: '#F59E0B',
    accent: '#10B981',
    badgeBg: '#9D174D',
    slabBevel: '#D97706',
  },
  classic_bilsem: {
    name: 'Klasik Bilsem',
    bgTop: '#0F172A',
    bgBottom: '#1E293B',
    cardBg: '#FFFFFF',
    cardBorder: '#3B82F6',
    accent: '#2563EB',
    badgeBg: '#1D4ED8',
    slabBevel: '#2563EB',
  },
};

let cachedFoxImage: HTMLImageElement | null = null;
let foxImageLoaded = false;

export function preloadFoxMascot(): Promise<HTMLImageElement | null> {
  if (foxImageLoaded && cachedFoxImage) {
    return Promise.resolve(cachedFoxImage);
  }
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedFoxImage = img;
      foxImageLoaded = true;
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = '/assets/aistudio/B_LSEM_Junior_tilki_ikonu_e352f23b.png';
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Professional 3D Slab Card with Soft Ambient Occlusion and Extruded Bevel Depth
 */
function draw3DSlabCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: string,
  borderColor: string,
  borderWidth: number,
  depth = 10,
  bevelColor = 'rgba(0,0,0,0.22)',
  shadowBlur = 28,
  shadowOffsetY = 16
) {
  ctx.save();

  // 1. Soft Drop Shadow (Ambient Occlusion)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = shadowOffsetY;

  // 2. 3D Bottom Extrusion Slab
  drawRoundedRect(ctx, x, y + depth, w, h, r);
  ctx.fillStyle = bevelColor;
  ctx.fill();

  // Reset shadow for main face
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 3. Top Face
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fillColor;
  ctx.fill();

  // 4. Subtle Specular Highlight Rim along top edge
  ctx.save();
  ctx.clip();
  const rimGrad = ctx.createLinearGradient(x, y, x, y + 16);
  rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(x, y, w, 16);
  ctx.restore();

  // 5. Border Stroke
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }

  ctx.restore();
}

function drawGeometricShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeType,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  rotationDeg = 0,
  filled = true,
  innerDot = false
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotationDeg * Math.PI) / 180);

  // Soft shape shadow for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(4, radius * 0.16);

  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  } else if (shape === 'square') {
    const s = radius * 1.55;
    ctx.rect(-s / 2, -s / 2, s, s);
  } else if (shape === 'diamond') {
    ctx.moveTo(0, -radius * 1.15);
    ctx.lineTo(radius * 0.95, 0);
    ctx.lineTo(0, radius * 1.15);
    ctx.lineTo(-radius * 0.95, 0);
    ctx.closePath();
  } else if (shape === 'triangle') {
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const px = Math.cos(angle) * radius * 1.12;
      const py = Math.sin(angle) * radius * 1.12;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'pentagon' || shape === 'hexagon') {
    const sides = shape === 'pentagon' ? 5 : 6;
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
      const px = Math.cos(angle) * radius * 1.05;
      const py = Math.sin(angle) * radius * 1.05;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'star') {
    const spikes = 5;
    const outerR = radius * 1.15;
    const innerR = radius * 0.5;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = -Math.PI / 2 + (i * Math.PI) / spikes;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else {
    // cross
    const arm = radius * 0.36;
    const len = radius * 1.05;
    ctx.moveTo(-arm, -len);
    ctx.lineTo(arm, -len);
    ctx.lineTo(arm, -arm);
    ctx.lineTo(len, -arm);
    ctx.lineTo(len, arm);
    ctx.lineTo(arm, arm);
    ctx.lineTo(arm, len);
    ctx.lineTo(-arm, len);
    ctx.lineTo(-arm, arm);
    ctx.lineTo(-len, arm);
    ctx.lineTo(-len, -arm);
    ctx.lineTo(-arm, -arm);
    ctx.closePath();
  }

  if (filled) {
    ctx.fill();
  } else {
    ctx.stroke();
  }

  if (innerDot) {
    ctx.beginPath();
    ctx.fillStyle = filled ? '#FFFFFF' : color;
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawMatrixCellContent(
  ctx: CanvasRenderingContext2D,
  cell: MatrixCellSpec,
  cx: number,
  cy: number,
  cellSize: number
) {
  const count = Math.max(1, Math.min(4, cell.count || 1));
  if (count === 1) {
    drawGeometricShape(
      ctx,
      cell.shape,
      cx,
      cy,
      cellSize * 0.28,
      cell.color,
      cell.rotation,
      cell.filled ?? true,
      cell.innerDot ?? false
    );
  } else if (count === 2) {
    const offset = cellSize * 0.19;
    drawGeometricShape(
      ctx,
      cell.shape,
      cx - offset,
      cy,
      cellSize * 0.19,
      cell.color,
      cell.rotation,
      cell.filled ?? true,
      cell.innerDot ?? false
    );
    drawGeometricShape(
      ctx,
      cell.shape,
      cx + offset,
      cy,
      cellSize * 0.19,
      cell.color,
      cell.rotation,
      cell.filled ?? true,
      cell.innerDot ?? false
    );
  } else {
    const positions =
      count === 3
        ? [
            [0, -cellSize * 0.18],
            [-cellSize * 0.19, cellSize * 0.16],
            [cellSize * 0.19, cellSize * 0.16],
          ]
        : [
            [-cellSize * 0.18, -cellSize * 0.18],
            [cellSize * 0.18, -cellSize * 0.18],
            [-cellSize * 0.18, cellSize * 0.18],
            [cellSize * 0.18, cellSize * 0.18],
          ];
    for (const [dx, dy] of positions) {
      drawGeometricShape(
        ctx,
        cell.shape,
        cx + dx,
        cy + dy,
        cellSize * 0.15,
        cell.color,
        cell.rotation,
        cell.filled ?? true,
        cell.innerDot ?? false
      );
    }
  }
}

/**
 * 3D Isometric Cube with Real-Time Shading, Specular Rim, and Ambient Occlusion
 */
function drawIsometricCube(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  baseColor: string
) {
  const cos30 = Math.cos(Math.PI / 6) * size;
  const sin30 = Math.sin(Math.PI / 6) * size;

  ctx.save();

  // Top face (Highlight Face with Radial Gradient)
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + cos30, cy - sin30);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx - cos30, cy - sin30);
  ctx.closePath();

  const topGrad = ctx.createLinearGradient(cx - cos30, cy - size, cx + cos30, cy);
  topGrad.addColorStop(0, '#BFDBFE'); // Soft light blue highlight
  topGrad.addColorStop(1, '#93C5FD');
  ctx.fillStyle = topGrad;
  ctx.fill();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // Left face (Mid-tone with baseColor)
  ctx.beginPath();
  ctx.moveTo(cx - cos30, cy - sin30);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - cos30, cy + sin30);
  ctx.closePath();
  ctx.fillStyle = baseColor || '#3B82F6';
  ctx.fill();
  ctx.stroke();

  // Right face (Deep Shadow Tone)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + cos30, cy - sin30);
  ctx.lineTo(cx + cos30, cy + sin30);
  ctx.lineTo(cx, cy + size);
  ctx.closePath();
  ctx.fillStyle = '#1D4ED8';
  ctx.fill();
  ctx.stroke();

  // Specular gleam line on top ridge
  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.9);
  ctx.lineTo(cx, cy - size * 0.1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

export interface ReelRenderState {
  puzzle: BilsemPuzzle;
  themeId: ReelThemeId;
  elapsedSec: number;
  totalDurationSec: number;
  countdownSeconds: number;
  revealAnswer: boolean;
  showMascot: boolean;
  showSubtitles: boolean;
}

/**
 * Enhanced 9:16 Scene Canvas Render Function
 * Features:
 * - 3D Layer Slabs with Ambient Occlusion Shadows
 * - Dynamic Floating Tilt & Breathing Animation
 * - Parallax Floating Particle Orbs
 * - Interactive 3D Depth on Matrices, Cubes, and Option Cards
 */
/**
 * Enhanced 9:16 Scene Canvas Render Function
 * Features:
 * - Camera Shake (Sarsılma) on question entry, countdown start, and answer reveal
 * - Optical Bloom & Solar Flare (Parlama) with rotating light beams and expanding shockwaves
 * - 3D Layer Slabs with Ambient Occlusion Shadows
 * - Dynamic Floating Tilt & Breathing Animation
 * - Parallax Floating Particle Orbs
 * - Interactive 3D Depth on Matrices, Cubes, and Option Cards
 */
export function renderReelFrame(
  ctx: CanvasRenderingContext2D,
  state: ReelRenderState
) {
  const {
    puzzle,
    themeId,
    elapsedSec,
    countdownSeconds,
    revealAnswer,
    showMascot,
    showSubtitles,
  } = state;

  const theme = REEL_THEME_CONFIGS[themeId] || REEL_THEME_CONFIGS.space_academy;

  // =========================================================================
  // TIMING & CAMERA SHAKE (SARSILMA) PHYSICS
  // =========================================================================
  const countdownStart = 1.5;
  const revealTime = countdownStart + countdownSeconds;
  const remaining = Math.max(
    0,
    Math.min(countdownSeconds, countdownSeconds - (elapsedSec - countdownStart))
  );
  const ratio = remaining / Math.max(1, countdownSeconds);

  // 1. Entry / Question Change Impact Shake (elapsedSec < 0.65)
  const entryT = Math.max(0, 1 - elapsedSec / 0.6);
  const entryShake = Math.sin(elapsedSec * 48) * 18 * entryT;

  // 2. Countdown Start Punch (elapsedSec around countdownStart)
  const cdPunchT =
    elapsedSec >= countdownStart - 0.1 && elapsedSec < countdownStart + 0.35
      ? Math.max(0, 1 - (elapsedSec - (countdownStart - 0.1)) / 0.45)
      : 0;
  const cdPunchShake = Math.sin((elapsedSec - countdownStart) * 55) * 14 * cdPunchT;

  // 3. Last 3 Seconds Ticking Heartbeat Pulses
  let tickShake = 0;
  if (remaining <= 3 && remaining > 0) {
    const frac = (countdownSeconds - (elapsedSec - countdownStart)) % 1;
    if (frac < 0.22) {
      const punchIntensity = (4 - remaining) * 3;
      tickShake = Math.sin(frac * Math.PI * 12) * punchIntensity * (1 - frac / 0.22);
    }
  }

  // 4. Reveal Answer / Countdown End Earthquake Shake
  let revealShake = 0;
  if (revealAnswer && elapsedSec >= revealTime && elapsedSec < revealTime + 0.85) {
    const dSec = elapsedSec - revealTime;
    revealShake = Math.sin(dSec * 52) * 28 * Math.exp(-dSec * 3.8);
  }

  const totalShakeX = (entryShake + cdPunchShake + tickShake + revealShake);
  const totalShakeY = Math.cos(elapsedSec * 38) * Math.abs(totalShakeX) * 0.65;
  const totalShakeAngle = (totalShakeX / REEL_WIDTH) * 0.016;

  // 1. Dynamic Background with Parallax Floating Bokeh Orbs
  const grad = ctx.createLinearGradient(0, 0, 0, REEL_HEIGHT);
  grad.addColorStop(0, theme.bgTop);
  grad.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, REEL_WIDTH, REEL_HEIGHT);

  // Parallax floating glowing bokeh orbs
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const speed = 0.4 + (i % 3) * 0.3;
    const sx = ((i * 187 + Math.sin(elapsedSec * speed + i) * 35) % (REEL_WIDTH - 60)) + 30;
    const sy = ((i * 243 + elapsedSec * 22 * speed) % (REEL_HEIGHT - 80)) + 40;
    const r = (i % 4) * 3 + 4;
    const pulseAlpha = 0.08 + Math.sin(elapsedSec * 2 + i) * 0.04;

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
    ctx.fill();
  }
  ctx.restore();

  // =========================================================================
  // APPLY CAMERA SHAKE MATRIX TO FOREGROUND SCENE
  // =========================================================================
  ctx.save();
  ctx.translate(REEL_WIDTH / 2, REEL_HEIGHT / 2);
  ctx.rotate(totalShakeAngle);
  ctx.translate(-REEL_WIDTH / 2 + totalShakeX, -REEL_HEIGHT / 2 + totalShakeY);

  // 2. Top Header Banner with 3D Slab Depth + BİLSEM Junior Fox Mascot
  const headX = 56;
  const headY = 64;
  const headW = REEL_WIDTH - 112;
  const headH = 146;

  draw3DSlabCard(
    ctx,
    headX,
    headY,
    headW,
    headH,
    36,
    'rgba(15, 23, 42, 0.88)',
    theme.cardBorder,
    4,
    8,
    'rgba(0, 0, 0, 0.4)',
    24,
    12
  );

  // Bouncing mascot with 3D frame
  if (showMascot && cachedFoxImage) {
    const bounce = Math.sin(elapsedSec * 4) * 6;
    ctx.save();
    // Mascot shadow
    ctx.beginPath();
    ctx.ellipse(137, 200, 38, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    drawRoundedRect(ctx, 82, 82 + bounce, 110, 110, 28);
    ctx.clip();
    ctx.drawImage(cachedFoxImage, 82, 82 + bounce, 110, 110);
    ctx.restore();
  } else {
    drawRoundedRect(ctx, 82, 82, 110, 110, 28);
    ctx.fillStyle = theme.accent;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 42px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦊', 137, 137);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '900 38px Inter, system-ui, sans-serif';
  ctx.fillText('BİLSEM JUNIOR', 216, 122);

  ctx.fillStyle = theme.accent;
  ctx.font = '700 26px Inter, system-ui, sans-serif';
  ctx.fillText(
    `${puzzle.gradeLevel} • ${puzzle.difficulty} • ${puzzle.subStyleLabel || 'Günün Zeka Sorusu'}`,
    216,
    166
  );

  // 3. Question Prompt Banner with 3D Layer Depth
  const promptX = 56;
  const promptY = 234;
  const promptW = REEL_WIDTH - 112;
  const promptH = 130;

  draw3DSlabCard(
    ctx,
    promptX,
    promptY,
    promptW,
    promptH,
    30,
    'rgba(30, 41, 59, 0.94)',
    theme.cardBorder,
    3,
    7,
    'rgba(0, 0, 0, 0.35)',
    20,
    10
  );

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 31px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(puzzle.questionPrompt, REEL_WIDTH / 2, 299, REEL_WIDTH - 160);

  // 4. Main Puzzle Stage Card with Dynamic 3D Perspective Tilt (390..1130)
  const stageX = 56;
  const stageY = 390;
  const stageW = REEL_WIDTH - 112;
  const stageH = 720;
  const stageCenterX = stageX + stageW / 2;
  const stageCenterY = stageY + stageH / 2;

  // Dynamic 3D tilt calculations based on elapsedSec
  const tiltAngle = Math.sin(elapsedSec * 1.5) * 0.014; // Subtle angle oscillation
  const tiltScale = 1 + Math.sin(elapsedSec * 2.2) * 0.007; // Gentle breathing

  ctx.save();
  ctx.translate(stageCenterX, stageCenterY);
  ctx.rotate(tiltAngle);
  ctx.scale(tiltScale, tiltScale);
  ctx.translate(-stageCenterX, -stageCenterY);

  // 3D Slab with Extrusion Bevel
  draw3DSlabCard(
    ctx,
    stageX,
    stageY,
    stageW,
    stageH,
    42,
    theme.cardBg,
    theme.cardBorder,
    6,
    12,
    theme.slabBevel || '#D97706',
    34,
    18
  );

  // Category 1: 3x3 Raven Matrix with 3D Tactile Tiles
  if (puzzle.category === 'matrix' && puzzle.matrixSpec) {
    const gridSize = 3;
    const cellW = 196;
    const gap = 22;
    const totalW = gridSize * cellW + (gridSize - 1) * gap;
    const startX = stageX + (stageW - totalW) / 2;
    const startY = stageY + (stageH - totalW) / 2;

    puzzle.matrixSpec.grid.forEach((cell, idx) => {
      const r = Math.floor(idx / 3);
      const c = idx % 3;
      const x = startX + c * (cellW + gap);
      const y = startY + r * (cellW + gap);

      if (cell === null) {
        // Question cell with pulsing neon halo and 3D depth
        const pulse = Math.sin(elapsedSec * 4) * 0.15;
        draw3DSlabCard(
          ctx,
          x,
          y,
          cellW,
          cellW,
          28,
          '#FEF3C7',
          '#F59E0B',
          5,
          6,
          '#D97706',
          18,
          8
        );

        ctx.fillStyle = '#D97706';
        ctx.font = '900 88px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + cellW / 2, y + cellW / 2 + pulse * 4);
      } else {
        // Standard cell with 3D tactile tile depth
        draw3DSlabCard(
          ctx,
          x,
          y,
          cellW,
          cellW,
          28,
          '#F8FAFC',
          '#CBD5E1',
          3,
          5,
          '#94A3B8',
          12,
          6
        );
        drawMatrixCellContent(ctx, cell, x + cellW / 2, y + cellW / 2, cellW);
      }
    });
  } else if (puzzle.category === 'cube3d' && puzzle.cubeSpec) {
    // Category 2: 3D Isometric Cube Stacking with Ground Shadow & Dynamic Angle Wobble
    const sortedCubes: CubeCoord[] = [...puzzle.cubeSpec.cubes].sort(
      (a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z
    );
    const cubeSize = 68;
    const originX = stageX + stageW / 2;
    const originY = stageY + stageH * 0.56;
    const cos30 = Math.cos(Math.PI / 6) * cubeSize;
    const sin30 = Math.sin(Math.PI / 6) * cubeSize;

    // Ground shadow under 3D cube tower
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(originX, originY + 40, 220, 48, 0, 0, Math.PI * 2);
    const groundShadow = ctx.createRadialGradient(originX, originY + 40, 20, originX, originY + 40, 220);
    groundShadow.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
    groundShadow.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = groundShadow;
    ctx.fill();
    ctx.restore();

    // Floating cube hover animation
    const cubeHover = Math.sin(elapsedSec * 2.5) * 5;

    for (const c of sortedCubes) {
      const screenX = originX + (c.x - c.y) * cos30;
      const screenY = originY + (c.x + c.y) * sin30 - c.z * cubeSize + cubeHover;
      drawIsometricCube(
        ctx,
        screenX,
        screenY,
        cubeSize,
        puzzle.cubeSpec.paletteColor
      );
    }
  } else if (puzzle.category === 'shadow' && puzzle.shadowSpec) {
    // Category 3: Shadow & Reflection with 3D Pedestal and Spotlight
    const { target } = puzzle.shadowSpec;
    const cx = stageX + stageW / 2;
    const cy = stageY + stageH / 2;

    // Target Figure Pedestal
    draw3DSlabCard(
      ctx,
      cx - 220,
      cy - 220,
      440,
      440,
      44,
      '#FFFFFF',
      '#CBD5E1',
      4,
      8,
      '#94A3B8',
      20,
      10
    );

    drawGeometricShape(
      ctx,
      target.shape,
      cx,
      cy,
      135,
      target.primaryColor,
      target.rotation,
      true,
      false
    );
    drawGeometricShape(
      ctx,
      target.secondaryShape,
      cx + 38,
      cy - 28,
      68,
      target.secondaryColor,
      target.rotation + 30,
      true,
      true
    );
  } else if (puzzle.category === 'cipher' && puzzle.cipherSpec) {
    // Category 4: Symbol Cipher Rows with 3D Row Slabs
    const rows = puzzle.cipherSpec.rows;
    const rowH = 135;
    const startY = stageY + 65;

    rows.forEach((row, rIdx) => {
      const y = startY + rIdx * (rowH + 18);
      draw3DSlabCard(
        ctx,
        stageX + 55,
        y,
        stageW - 110,
        rowH,
        26,
        row.isQuestionRow ? '#FEF3C7' : '#FFFFFF',
        row.isQuestionRow ? '#F59E0B' : '#CBD5E1',
        3,
        6,
        row.isQuestionRow ? '#D97706' : '#94A3B8',
        14,
        6
      );

      row.symbols.forEach((sym, sIdx) => {
        const sx = stageX + 150 + sIdx * 125;
        const sy = y + rowH / 2;
        drawGeometricShape(
          ctx,
          sym,
          sx,
          sy,
          38,
          row.symbolColors[sIdx] || '#4F46E5',
          0,
          true,
          false
        );
      });

      ctx.fillStyle = '#64748B';
      ctx.font = '900 44px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('➜', stageX + 540, y + rowH / 2);

      ctx.fillStyle = row.isQuestionRow ? '#D97706' : '#0F172A';
      ctx.font = '900 50px Inter, system-ui, sans-serif';
      ctx.fillText(row.codeOutput, stageX + 725, y + rowH / 2);
    });
  }

  ctx.restore(); // Restore Stage Tilt Transform

  // 5. Countdown Bar with Glowing 3D Glass Tube (1138..1210)
  draw3DSlabCard(
    ctx,
    56,
    1138,
    REEL_WIDTH - 112,
    64,
    32,
    'rgba(15, 23, 42, 0.92)',
    '#334155',
    3,
    5,
    '#0F172A',
    16,
    8
  );

  const fillW = Math.max(64, (REEL_WIDTH - 124) * ratio);
  drawRoundedRect(ctx, 62, 1144, fillW, 52, 26);
  ctx.fillStyle = remaining > 1.5 ? theme.accent : '#EF4444';
  ctx.fill();

  // Animated traveling gleam light on progress bar
  const gleamOffset = ((elapsedSec * 280) % fillW);
  ctx.save();
  ctx.beginPath();
  ctx.arc(62 + gleamOffset, 1170, 24, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 28px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    remaining > 0.1
      ? `⏱️ Süre: ${Math.ceil(remaining)} Saniye`
      : revealAnswer
      ? `✅ Doğru Cevap: ${['A', 'B', 'C', 'D'][puzzle.correctOptionIndex]} Şıkkı!`
      : '💬 Süre Doldu! Cevabını Yorumlara Yaz! 👇',
    REEL_WIDTH / 2,
    1170
  );

  // 6. Options Grid (2x2 for A, B, C, D) with Floating 3D Bobbing (1230..1690)
  const optLetters = ['A', 'B', 'C', 'D'];
  const optW = (REEL_WIDTH - 144) / 2;
  const optH = 210;

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    // Subtle staggered vertical bobbing
    const bobY = Math.sin(elapsedSec * 3 + i * 0.85) * 5;
    const ox = 56 + col * (optW + 32);
    const oy = 1230 + row * (optH + 28) + bobY;
    const isWinner =
      revealAnswer &&
      elapsedSec >= countdownStart + countdownSeconds &&
      i === puzzle.correctOptionIndex;

    // 3D Slab Card for each option
    draw3DSlabCard(
      ctx,
      ox,
      oy,
      optW,
      optH,
      32,
      isWinner ? '#DCFCE7' : '#FFFFFF',
      isWinner ? '#16A34A' : theme.cardBorder,
      isWinner ? 8 : 4,
      8,
      isWinner ? '#15803D' : theme.slabBevel || '#4338CA',
      24,
      12
    );

    // Option 3D Letter Badge
    draw3DSlabCard(
      ctx,
      ox + 22,
      oy + 22,
      68,
      68,
      20,
      isWinner ? '#16A34A' : theme.badgeBg,
      '#FFFFFF',
      2,
      4,
      'rgba(0,0,0,0.3)',
      10,
      4
    );

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(optLetters[i], ox + 56, oy + 56);

    const contentCx = ox + optW * 0.6;
    const contentCy = oy + optH / 2;

    if (puzzle.category === 'matrix' && puzzle.matrixSpec?.options[i]) {
      drawMatrixCellContent(
        ctx,
        puzzle.matrixSpec.options[i],
        contentCx,
        contentCy,
        155
      );
    } else if (puzzle.category === 'cube3d' && puzzle.cubeSpec) {
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 64px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${puzzle.cubeSpec.options[i]} Küp`, contentCx, contentCy);
    } else if (puzzle.category === 'shadow' && puzzle.shadowSpec?.options[i]) {
      const opt = puzzle.shadowSpec.options[i];
      drawGeometricShape(
        ctx,
        opt.shape,
        contentCx,
        contentCy,
        58,
        '#0F172A',
        opt.rotation,
        true,
        false
      );
      if (opt.secondaryShape) {
        drawGeometricShape(
          ctx,
          opt.secondaryShape,
          contentCx + 20 * (opt.offsetX || 1),
          contentCy - 14,
          30,
          '#0F172A',
          opt.rotation + 30,
          true,
          false
        );
      }
    } else if (puzzle.category === 'cipher' && puzzle.cipherSpec) {
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 54px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(puzzle.cipherSpec.options[i] || '', contentCx, contentCy);
    }
  }

  // 7. Karaoke Subtitles / Footer Call-to-Action with 3D Slab (1720..1860)
  if (showSubtitles) {
    const isEndingHook = elapsedSec >= countdownStart + countdownSeconds + 1.2;

    draw3DSlabCard(
      ctx,
      48,
      1720,
      REEL_WIDTH - 96,
      140,
      28,
      isEndingHook ? 'rgba(48, 25, 105, 0.96)' : 'rgba(15, 23, 42, 0.94)',
      isEndingHook ? '#F59E0B' : theme.accent,
      isEndingHook ? 4 : 3,
      7,
      'rgba(0,0,0,0.4)',
      20,
      10
    );

    if (isEndingHook) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎁 HEDİYE: YORUMA "BİLSEM" YAZ!', REEL_WIDTH / 2, 1756);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 28px Inter, system-ui, sans-serif';
      ctx.fillText('15 Soruluk MEB Deneme Sınavı DM ile Gelsin! 📩', REEL_WIDTH / 2, 1798);

      ctx.fillStyle = '#93C5FD';
      ctx.font = '600 20px Inter, system-ui, sans-serif';
      ctx.fillText('BİLSEM Junior Tablet Simülatörü • Profildeki Linkte', REEL_WIDTH / 2, 1834);
    } else {
      const subText =
        elapsedSec < countdownStart + countdownSeconds
          ? `🎤 ${puzzle.questionPrompt}`
          : revealAnswer
          ? `🎉 Doğru Cevap ${['A', 'B', 'C', 'D'][puzzle.correctOptionIndex]}! Tebrikler!`
          : '👇 Cevabı bulabildin mi? A, B, C veya D şıkkını yorumlara yaz!';

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '800 28px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(subText, REEL_WIDTH / 2, 1790, REEL_WIDTH - 140);
    }
  }

  // =========================================================================
  // PARLAMA (LIGHT FLARE, OPTICAL BLOOM & 3D LIGHT BEAMS)
  // =========================================================================

  // A. Question Entry Anamorphic Light Flare & Flash (elapsedSec < 0.65)
  if (elapsedSec < 0.65) {
    const flashAlpha = Math.max(0, 1 - elapsedSec / 0.55) * 0.45;
    ctx.save();
    // Radial glow over the main stage
    const entryFlare = ctx.createRadialGradient(
      stageCenterX,
      stageCenterY,
      40,
      stageCenterX,
      stageCenterY,
      500
    );
    entryFlare.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
    entryFlare.addColorStop(0.4, `rgba(251, 191, 36, ${flashAlpha * 0.6})`);
    entryFlare.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = entryFlare;
    ctx.fillRect(0, 0, REEL_WIDTH, REEL_HEIGHT);

    // Horizontal Anamorphic Light Streak across stage
    const streakH = 80;
    const streakGrad = ctx.createLinearGradient(0, stageCenterY - streakH, 0, stageCenterY + streakH);
    streakGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    streakGrad.addColorStop(0.5, `rgba(255, 255, 255, ${flashAlpha * 0.7})`);
    streakGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = streakGrad;
    ctx.fillRect(0, stageCenterY - streakH, REEL_WIDTH, streakH * 2);
    ctx.restore();
  }

  // B. Critical Countdown Pulse Bloom (remaining <= 3 && remaining > 0)
  if (remaining <= 3 && remaining > 0) {
    const pulseFactor = (3 - remaining) / 3;
    const pulseAlpha = (0.15 + Math.sin(elapsedSec * 14) * 0.12) * pulseFactor;
    ctx.save();
    const borderGlow = ctx.createRadialGradient(
      REEL_WIDTH / 2,
      REEL_HEIGHT / 2,
      REEL_WIDTH * 0.35,
      REEL_WIDTH / 2,
      REEL_HEIGHT / 2,
      REEL_WIDTH * 0.75
    );
    borderGlow.addColorStop(0, 'rgba(239, 68, 68, 0)');
    borderGlow.addColorStop(0.8, `rgba(239, 68, 68, ${pulseAlpha * 0.5})`);
    borderGlow.addColorStop(1, `rgba(245, 158, 11, ${pulseAlpha})`);
    ctx.fillStyle = borderGlow;
    ctx.fillRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
    ctx.restore();
  }

  // C. Answer Reveal Mega-Bloom, Volumetric Beams & Expanding Shockwave Ring
  if (revealAnswer && elapsedSec >= revealTime && elapsedSec < revealTime + 1.6) {
    const dSec = elapsedSec - revealTime;
    const bloomAlpha = Math.max(0, 1 - dSec / 1.4);

    // Center of winner option card
    const winnerIdx = puzzle.correctOptionIndex;
    const winCol = winnerIdx % 2;
    const winRow = Math.floor(winnerIdx / 2);
    const winCx = 56 + winCol * (optW + 32) + optW / 2;
    const winCy = 1230 + winRow * (optH + 28) + optH / 2;

    ctx.save();
    // 1. Expanding Neon Shockwave Ring
    const waveRadius = dSec * 420;
    const waveAlpha = Math.max(0, 1 - dSec / 0.85);
    ctx.beginPath();
    ctx.arc(winCx, winCy, waveRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(52, 211, 153, ${waveAlpha})`;
    ctx.lineWidth = 14 * (1 - dSec / 0.85);
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 32;
    ctx.stroke();

    // 2. Rotating 3D Volumetric Rays (12 beams)
    const beamCount = 12;
    const rayRot = elapsedSec * 1.5;
    ctx.translate(winCx, winCy);
    for (let b = 0; b < beamCount; b++) {
      const angle = rayRot + (b * Math.PI * 2) / beamCount;
      const beamLen = 380 * Math.min(1, dSec * 4);
      const halfW = 0.12;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle - halfW) * beamLen, Math.sin(angle - halfW) * beamLen);
      ctx.lineTo(Math.cos(angle + halfW) * beamLen, Math.sin(angle + halfW) * beamLen);
      ctx.closePath();

      const beamGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, beamLen);
      beamGrad.addColorStop(0, `rgba(254, 240, 138, ${bloomAlpha * 0.45})`);
      beamGrad.addColorStop(0.5, `rgba(16, 185, 129, ${bloomAlpha * 0.25})`);
      beamGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fill();
    }
    ctx.translate(-winCx, -winCy);

    // 3. Central Solar Flare Bloom
    const flareGrad = ctx.createRadialGradient(winCx, winCy, 20, winCx, winCy, 360);
    flareGrad.addColorStop(0, `rgba(255, 255, 255, ${bloomAlpha * 0.85})`);
    flareGrad.addColorStop(0.3, `rgba(251, 191, 36, ${bloomAlpha * 0.55})`);
    flareGrad.addColorStop(0.7, `rgba(16, 185, 129, ${bloomAlpha * 0.25})`);
    flareGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, REEL_WIDTH, REEL_HEIGHT);
    ctx.restore();
  }

  // Restore camera shake transform
  ctx.restore();
}
