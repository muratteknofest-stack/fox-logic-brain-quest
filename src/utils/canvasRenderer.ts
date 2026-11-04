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
  },
  neon_quiz: {
    name: 'Neon Yarışma',
    bgTop: '#090D16',
    bgBottom: '#111827',
    cardBg: '#F8FAFC',
    cardBorder: '#06B6D4',
    accent: '#EC4899',
    badgeBg: '#0E7490',
  },
  playful_pop: {
    name: 'Oyun Odası',
    bgTop: '#1E1B4B',
    bgBottom: '#311042',
    cardBg: '#FFFBEB',
    cardBorder: '#F59E0B',
    accent: '#10B981',
    badgeBg: '#9D174D',
  },
  classic_bilsem: {
    name: 'Klasik Bilsem',
    bgTop: '#0F172A',
    bgBottom: '#1E293B',
    cardBg: '#FFFFFF',
    cardBorder: '#3B82F6',
    accent: '#2563EB',
    badgeBg: '#1D4ED8',
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

function drawIsometricCube(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  baseColor: string
) {
  const cos30 = Math.cos(Math.PI / 6) * size;
  const sin30 = Math.sin(Math.PI / 6) * size;

  // Top face
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + cos30, cy - sin30);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx - cos30, cy - sin30);
  ctx.closePath();
  ctx.fillStyle = '#60A5FA';
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Left face
  ctx.beginPath();
  ctx.moveTo(cx - cos30, cy - sin30);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - cos30, cy + sin30);
  ctx.closePath();
  ctx.fillStyle = baseColor || '#3B82F6';
  ctx.fill();
  ctx.stroke();

  // Right face
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + cos30, cy - sin30);
  ctx.lineTo(cx + cos30, cy + sin30);
  ctx.lineTo(cx, cy + size);
  ctx.closePath();
  ctx.fillStyle = '#1D4ED8';
  ctx.fill();
  ctx.stroke();
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

  // 1. Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, REEL_HEIGHT);
  grad.addColorStop(0, theme.bgTop);
  grad.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, REEL_WIDTH, REEL_HEIGHT);

  // Subtle decorative stars/dots
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 18; i++) {
    const sx = ((i * 173) % 980) + 50;
    const sy = ((i * 293) % 1750) + 80;
    const r = (i % 3) + 2;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Top Header Banner + BİLSEM Junior Tilki Maskotu
  drawRoundedRect(ctx, 56, 64, REEL_WIDTH - 112, 146, 36);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.fill();
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 4;
  ctx.stroke();

  if (showMascot && cachedFoxImage) {
    const bounce = Math.sin(elapsedSec * 4) * 5;
    ctx.save();
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

  // 3. Question Prompt Banner
  drawRoundedRect(ctx, 56, 234, REEL_WIDTH - 112, 130, 30);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 31px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(puzzle.questionPrompt, REEL_WIDTH / 2, 299, REEL_WIDTH - 160);

  // 4. Main Puzzle Stage Card (390..1130)
  const stageX = 56;
  const stageY = 390;
  const stageW = REEL_WIDTH - 112;
  const stageH = 720;

  drawRoundedRect(ctx, stageX, stageY, stageW, stageH, 42);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 6;
  ctx.stroke();

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

      drawRoundedRect(ctx, x, y, cellW, cellW, 28);
      ctx.fillStyle = cell === null ? '#FEF3C7' : '#F1F5F9';
      ctx.fill();
      ctx.strokeStyle = cell === null ? '#F59E0B' : '#CBD5E1';
      ctx.lineWidth = cell === null ? 5 : 3;
      ctx.stroke();

      if (cell) {
        drawMatrixCellContent(ctx, cell, x + cellW / 2, y + cellW / 2, cellW);
      } else {
        ctx.fillStyle = '#D97706';
        ctx.font = '900 88px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + cellW / 2, y + cellW / 2);
      }
    });
  } else if (puzzle.category === 'cube3d' && puzzle.cubeSpec) {
    const sortedCubes: CubeCoord[] = [...puzzle.cubeSpec.cubes].sort(
      (a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z
    );
    const cubeSize = 68;
    const originX = stageX + stageW / 2;
    const originY = stageY + stageH * 0.56;
    const cos30 = Math.cos(Math.PI / 6) * cubeSize;
    const sin30 = Math.sin(Math.PI / 6) * cubeSize;

    for (const c of sortedCubes) {
      const screenX = originX + (c.x - c.y) * cos30;
      const screenY = originY + (c.x + c.y) * sin30 - c.z * cubeSize;
      drawIsometricCube(
        ctx,
        screenX,
        screenY,
        cubeSize,
        puzzle.cubeSpec.paletteColor
      );
    }
  } else if (puzzle.category === 'shadow' && puzzle.shadowSpec) {
    const { target } = puzzle.shadowSpec;
    const cx = stageX + stageW / 2;
    const cy = stageY + stageH / 2;

    drawRoundedRect(ctx, cx - 220, cy - 220, 440, 440, 44);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 4;
    ctx.stroke();

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
    const rows = puzzle.cipherSpec.rows;
    const rowH = 135;
    const startY = stageY + 65;

    rows.forEach((row, rIdx) => {
      const y = startY + rIdx * (rowH + 18);
      drawRoundedRect(ctx, stageX + 55, y, stageW - 110, rowH, 26);
      ctx.fillStyle = row.isQuestionRow ? '#FEF3C7' : '#F1F5F9';
      ctx.fill();
      ctx.strokeStyle = row.isQuestionRow ? '#F59E0B' : '#CBD5E1';
      ctx.lineWidth = 3;
      ctx.stroke();

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

  // 5. Countdown Bar (1138..1210)
  const countdownStart = 1.5;
  const remaining = Math.max(
    0,
    Math.min(countdownSeconds, countdownSeconds - (elapsedSec - countdownStart))
  );
  const ratio = remaining / Math.max(1, countdownSeconds);

  drawRoundedRect(ctx, 56, 1138, REEL_WIDTH - 112, 64, 32);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();

  const fillW = Math.max(64, (REEL_WIDTH - 124) * ratio);
  drawRoundedRect(ctx, 62, 1144, fillW, 52, 26);
  ctx.fillStyle = remaining > 1.5 ? theme.accent : '#EF4444';
  ctx.fill();

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

  // 6. Options Grid (2x2 for A, B, C, D) (1230..1690)
  const optLetters = ['A', 'B', 'C', 'D'];
  const optW = (REEL_WIDTH - 144) / 2;
  const optH = 210;

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ox = 56 + col * (optW + 32);
    const oy = 1230 + row * (optH + 28);
    const isWinner =
      revealAnswer && elapsedSec >= countdownStart + countdownSeconds && i === puzzle.correctOptionIndex;

    drawRoundedRect(ctx, ox, oy, optW, optH, 32);
    ctx.fillStyle = isWinner ? '#DCFCE7' : '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = isWinner ? '#16A34A' : theme.cardBorder;
    ctx.lineWidth = isWinner ? 8 : 4;
    ctx.stroke();

    // Option Letter Badge
    drawRoundedRect(ctx, ox + 22, oy + 22, 68, 68, 20);
    ctx.fillStyle = isWinner ? '#16A34A' : theme.badgeBg;
    ctx.fill();
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

  // 7. Karaoke Subtitles / Footer Call-to-Action (1730..1870)
  if (showSubtitles) {
    const isEndingHook = elapsedSec >= countdownStart + countdownSeconds + 1.2;

    drawRoundedRect(ctx, 48, 1720, REEL_WIDTH - 96, 140, 28);
    ctx.fillStyle = isEndingHook ? 'rgba(48, 25, 105, 0.95)' : 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.strokeStyle = isEndingHook ? '#F59E0B' : theme.accent;
    ctx.lineWidth = isEndingHook ? 4 : 3;
    ctx.stroke();

    if (isEndingHook) {
      // High-converting viral CTA
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
}
