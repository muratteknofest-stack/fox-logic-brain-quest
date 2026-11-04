import {
  BilsemPuzzle,
  PuzzleCategory,
  GradeLevel,
  DifficultyLevel,
  ShapeType,
  MatrixCellSpec,
  CubeCoord,
  ReelThemeId,
  MusicTrackId,
  ScheduledReelItem,
} from '../types/puzzle';

export const ALL_CATEGORIES: PuzzleCategory[] = [
  'matrix',
  'cube3d',
  'shadow',
  'cipher',
];

export const ALL_GRADES: GradeLevel[] = ['1. Sınıf', '2. Sınıf', '3. Sınıf'];

export const ALL_DIFFICULTIES: DifficultyLevel[] = ['Kolay', 'Orta', 'Zor'];

export const ALL_THEMES: ReelThemeId[] = [
  'space_academy',
  'neon_quiz',
  'playful_pop',
  'classic_bilsem',
];

export const ALL_AUTO_MUSIC_TRACKS: MusicTrackId[] = [
  'quiz_show',
  'playful_marimba',
  'lofi_focus',
  'cosmic_synth',
];

const SHAPES: ShapeType[] = [
  'triangle',
  'star',
  'pentagon',
  'hexagon',
  'diamond',
  'square',
  'circle',
  'cross',
];

const PALETTE = [
  '#4F46E5', // Indigo
  '#0284C7', // Sky Blue
  '#D97706', // Amber
  '#059669', // Emerald
  '#DC2626', // Crimson
  '#7C3AED', // Violet
];

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 100% Quota-Free Mathematical & Procedural BİLSEM Junior Puzzle Generator
 * Supports diverse sub-styles within each category so every Reel feels fresh.
 */
export function generateProceduralBilsemPuzzle(
  category: PuzzleCategory,
  gradeLevel: GradeLevel,
  difficulty: DifficultyLevel,
  styleSeed?: number
): BilsemPuzzle {
  const id = `bilsem-proc-${category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const correctOptionIndex = Math.floor(Math.random() * 4);
  const subVariant =
    styleSeed !== undefined ? styleSeed % 3 : Math.floor(Math.random() * 3);

  if (category === 'matrix') {
    const rowShapes = shuffleArray(SHAPES).slice(0, 3);
    const rowColors = shuffleArray(PALETTE).slice(0, 3);
    const rotStep =
      difficulty === 'Kolay' ? 90 : difficulty === 'Orta' ? 90 : 45;
    const baseRot = pickRandom([0, 45, 90]);

    const subStyles = [
      {
        mode: 'col_inc',
        label: 'Sayı Artışlı Örüntü Matrisi',
        prompt: 'Sütun boyunca artan şekil kuralına göre (?) yerine hangisi gelmeli?',
      },
      {
        mode: 'rot_shift',
        label: 'Döndürme & Yön Matrisi',
        prompt: 'Saat yönünde dönen şekil örüntüsünde (?) kutusuna hangisi gelir?',
      },
      {
        mode: 'latin_square',
        label: 'Raven Çapraz Renk Matrisi',
        prompt: 'Her satırda farklı şekil ve renk kuralına göre (?) yerine hangisi gelir?',
      },
    ] as const;

    const chosenStyle = subStyles[subVariant];

    const buildCell = (r: number, c: number): MatrixCellSpec => {
      const shape =
        chosenStyle.mode === 'latin_square'
          ? rowShapes[(r + c) % 3]
          : rowShapes[r];
      const color =
        chosenStyle.mode === 'latin_square'
          ? rowColors[(r + c * 2) % 3]
          : rowColors[r];
      const rotation =
        (baseRot + c * rotStep + r * (difficulty === 'Zor' ? 45 : 0)) % 360;
      const count =
        chosenStyle.mode === 'col_inc'
          ? c + 1
          : chosenStyle.mode === 'rot_shift'
          ? ((r + c) % 2) + 1
          : ((r + c) % 3) + 1;
      const innerDot = (r + c) % 2 === 0;
      return {
        shape,
        color,
        rotation,
        count,
        innerDot,
        filled: true,
      };
    };

    const grid: (MatrixCellSpec | null)[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 2 && c === 2) {
          grid.push(null);
        } else {
          grid.push(buildCell(r, c));
        }
      }
    }

    const winningCell = buildCell(2, 2);
    const distractors: MatrixCellSpec[] = [
      {
        ...winningCell,
        rotation: (winningCell.rotation + 90) % 360,
      },
      {
        ...winningCell,
        count: (winningCell.count % 3) + 1,
        rotation: (winningCell.rotation + 180) % 360,
      },
      {
        ...winningCell,
        shape: rowShapes[0],
        color: rowColors[1],
      },
    ];

    const options: MatrixCellSpec[] = [];
    let dIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctOptionIndex) {
        options.push(winningCell);
      } else {
        options.push(distractors[dIdx++]);
      }
    }

    return {
      id,
      title: `${chosenStyle.label} #${Math.floor(100 + Math.random() * 900)}`,
      category: 'matrix',
      subStyleLabel: chosenStyle.label,
      gradeLevel,
      difficulty,
      questionPrompt: chosenStyle.prompt,
      correctOptionIndex,
      explanation:
        'Satır ve sütun kuralını çözdüysen cevabını (A, B, C veya D) hemen yorumlara yaz!',
      voiceoverQuestion: `Bilsem Junior ${gradeLevel} zeka sorusu! Tablodaki şekillerin dönüş yönünü ve kuralını dikkatlice incele. Soru işaretli yere hangi şık gelmeli? Beş saniyen başladı!`,
      voiceoverAnswer:
        'Süre doldu! Bakalım bu örüntüyü kimler doğru çözdü? Cevabını hemen yorumlara yaz, yarınki soruyu kaçırmamak için takip etmeyi unutma!',
      caption: `🧠 BİLSEM Junior (${gradeLevel} · ${chosenStyle.label})! 5 saniyede örüntüyü çözebildin mi? Senin cevabın A, B, C mi yoksa D mi? Yorumlara yaz! 👇`,
      hashtags: [
        '#bilsem',
        '#bilsemjunior',
        '#zekasorusu',
        '#örüntü',
        '#bilsemhazırlık',
        '#akıloyunları',
      ],
      createdAt: new Date().toISOString(),
      matrixSpec: {
        grid,
        options,
      },
    };
  }

  if (category === 'cube3d') {
    const subStyles = [
      {
        label: 'Basamaklı 3B Küp Kulesi',
        prompt: 'Bu basamaklı yapıda görünmeyenler dahil toplam kaç birim küp vardır?',
      },
      {
        label: 'Köşe L-Blok Küp Sayma',
        prompt: 'Köşe blok yapısında altta kalanlar dahil toplam kaç küp bulunuyor?',
      },
      {
        label: 'Uzamsal İkiz Kule Küp Analizi',
        prompt: 'Üst üste dizilmiş bu küp kulesinde toplam kaç adet birim küp var?',
      },
    ] as const;
    const chosenStyle = subStyles[subVariant];

    const maxCoord = difficulty === 'Kolay' ? 2 : 3;
    const maxHeight =
      difficulty === 'Kolay' ? 2 : difficulty === 'Orta' ? 3 : 4;
    const cubes: CubeCoord[] = [];

    for (let x = 0; x < maxCoord; x++) {
      for (let y = 0; y < maxCoord; y++) {
        const distFromBack = x + y;
        let colHeight = Math.max(0, maxHeight - distFromBack);
        if (subVariant === 1 && x === 1 && y === 1) {
          colHeight = Math.min(colHeight, 1);
        }
        if (colHeight > 0 && Math.random() > 0.35) {
          colHeight = Math.max(1, colHeight - (Math.random() > 0.6 ? 1 : 0));
        }
        for (let z = 0; z < colHeight; z++) {
          cubes.push({ x, y, z });
        }
      }
    }

    if (cubes.length < 6) {
      const fallback: CubeCoord[] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: 2 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 0, z: 1 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 1, z: 1 },
        { x: 1, y: 1, z: 0 },
      ];
      cubes.splice(0, cubes.length, ...fallback);
    }

    const exactCount = cubes.length;
    const offsets = shuffleArray([-2, -1, 1, 2, 3]);
    const options: number[] = [];
    let oIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctOptionIndex) {
        options.push(exactCount);
      } else {
        const candidate = Math.max(4, exactCount + offsets[oIdx++]);
        options.push(candidate === exactCount ? exactCount + 3 : candidate);
      }
    }

    return {
      id,
      title: `${chosenStyle.label} #${Math.floor(100 + Math.random() * 900)}`,
      category: 'cube3d',
      subStyleLabel: chosenStyle.label,
      gradeLevel,
      difficulty,
      questionPrompt: chosenStyle.prompt,
      correctOptionIndex,
      explanation:
        'Üstteki küplerin altında kalan görünmeyen küpleri de saydın mı? Cevabını yorumlara yaz!',
      voiceoverQuestion: `Bilsem Junior ${gradeLevel} üç boyutlu küp sayma sorusu! Üstteki küplerin altında görünmeyen küpler olduğunu unutma. Toplam kaç birim küp var? Beş saniyen başladı!`,
      voiceoverAnswer:
        'Süre bitti! Toplam kaç küp saydın? Bulduğun şıkkı hemen yorumlara yaz, bakalım kimler doğru saymış!',
      caption: `🧊 Görünmeyen küpleri de hesaba katabildin mi? BİLSEM (${gradeLevel} · ${chosenStyle.label}) sorusunda senin cevabın hangisi? Yorumlara bekliyoruz! ✨`,
      hashtags: [
        '#bilsem',
        '#bilsemjunior',
        '#küpsayma',
        '#uzamsalzeka',
        '#matematik',
        '#zekasorusu',
      ],
      createdAt: new Date().toISOString(),
      cubeSpec: {
        paletteColor: pickRandom(PALETTE),
        cubes,
        options,
      },
    };
  }

  if (category === 'shadow') {
    const subStyles = [
      {
        mode: 'shadow' as const,
        label: 'Birleşik Gölge Analizi',
        prompt: 'Yukarıdaki birleşik şeklin doğru gölgesi hangisidir?',
      },
      {
        mode: 'reflection' as const,
        label: 'Açı & Yön Silüet Eşleştirme',
        prompt: 'Hedef şeklin duruş açısıyla birebir örtüşen silüet hangisidir?',
      },
      {
        mode: 'piece' as const,
        label: 'Görsel Parça-Bütün Gölgesi',
        prompt: 'Merkezdeki iki parçalı figürün gerçek gölgesi hangi şıktadır?',
      },
    ];
    const chosenStyle = subStyles[subVariant];

    const pickedShapes = shuffleArray(SHAPES);
    const primaryShape = pickedShapes[0];
    const secondaryShape = pickedShapes[1];
    const altShape = pickedShapes[2];
    const pickedColors = shuffleArray(PALETTE);
    const targetRot = pickRandom([15, 45, 75, 120, 165, 210]);

    const distractors = [
      {
        shape: primaryShape,
        secondaryShape,
        rotation: (targetRot + 90) % 360,
        scaleX: 1,
        scaleY: 1,
        offsetX: -1,
        isShadow: true,
      },
      {
        shape: altShape,
        secondaryShape,
        rotation: targetRot,
        scaleX: 1,
        scaleY: 1,
        offsetX: 1,
        isShadow: true,
      },
      {
        shape: primaryShape,
        secondaryShape: altShape,
        rotation: (targetRot + 180) % 360,
        scaleX: 1,
        scaleY: 1,
        offsetX: 1,
        isShadow: true,
      },
    ];

    const options = [];
    let dIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctOptionIndex) {
        options.push({
          shape: primaryShape,
          secondaryShape,
          rotation: targetRot,
          scaleX: 1,
          scaleY: 1,
          offsetX: 1,
          isShadow: true,
        });
      } else {
        options.push(distractors[dIdx++]);
      }
    }

    return {
      id,
      title: `${chosenStyle.label} #${Math.floor(100 + Math.random() * 900)}`,
      category: 'shadow',
      subStyleLabel: chosenStyle.label,
      gradeLevel,
      difficulty,
      questionPrompt: chosenStyle.prompt,
      correctOptionIndex,
      explanation:
        'Şeklin duruş açısına ve parça yönüne dikkat et! Doğru şıkkı yorumlara bırak!',
      voiceoverQuestion: `Bilsem Junior ${gradeLevel} gölge ve görsel algı sorusu! Yukarıdaki renkli şeklin gerçek gölgesi hangi şıkta gizli? Dikkatli bak, beş saniyen başladı!`,
      voiceoverAnswer:
        'Süre doldu! Doğru gölgeyi ilk bakışta bulabildin mi? Cevabını hemen yorumlara yaz!',
      caption: `🕵️‍♂️ Dikkat ve Görsel Algı Testi (${gradeLevel} · ${chosenStyle.label})! Doğru gölgeyi 5 saniyede bulabildin mi? Cevabını yorumlara yaz! 🎯`,
      hashtags: [
        '#bilsem',
        '#bilsemjunior',
        '#görselalgı',
        '#dikkatgeliştirme',
        '#zekasoruları',
      ],
      createdAt: new Date().toISOString(),
      shadowSpec: {
        mode: chosenStyle.mode,
        target: {
          shape: primaryShape,
          secondaryShape,
          primaryColor: pickedColors[0],
          secondaryColor: pickedColors[1],
          rotation: targetRot,
        },
        options,
      },
    };
  }

  // Category: 'cipher'
  const cipherStyles = [
    {
      mode: 'digits',
      label: 'Sembol-Rakam Şifre Tablosu',
      prompt: 'Şifre tablosuna göre en alttaki sembol dizisinin sayı karşılığı nedir?',
      tokens: ['2', '3', '4', '5', '6', '7', '8', '9'],
    },
    {
      mode: 'letters',
      label: 'Kriptoloji Harf Kodlama',
      prompt: 'Her sembol bir harfi temsil ediyor. Soru işaretli satırın harf kodu nedir?',
      tokens: ['K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'],
    },
    {
      mode: 'pairs',
      label: 'Çapraz Mantık Şifreleme',
      prompt: 'İpuçlarını takip ederek en alttaki üç sembolün şifre kodunu bulun!',
      tokens: ['10', '20', '30', '40', '50', '60', '70', '80'],
    },
  ] as const;

  const chosenCipher = cipherStyles[subVariant];
  const syms = shuffleArray(SHAPES).slice(0, 4);
  const cols = shuffleArray(PALETTE).slice(0, 4);
  const pickedTokens = shuffleArray([...chosenCipher.tokens]).slice(0, 4);

  const rowIndices = [
    [0, 1, 2],
    [3, 2, 1],
    [1, 0, 3],
    [3, 0, 2], // Question row
  ];

  const rows = rowIndices.map((indices, rIdx) => {
    const isQ = rIdx === 3;
    const rowSyms = indices.map((i) => syms[i]);
    const rowCols = indices.map((i) => cols[i]);
    const code = indices.map((i) => pickedTokens[i]).join(' ');
    return {
      symbols: rowSyms,
      symbolColors: rowCols,
      codeOutput: isQ ? '? ? ?' : code,
      isQuestionRow: isQ,
    };
  });

  const correctCode = rowIndices[3].map((i) => pickedTokens[i]).join(' ');
  const distractorCodes = [
    [rowIndices[3][1], rowIndices[3][0], rowIndices[3][2]]
      .map((i) => pickedTokens[i])
      .join(' '),
    [rowIndices[3][0], rowIndices[3][2], rowIndices[3][1]]
      .map((i) => pickedTokens[i])
      .join(' '),
    [rowIndices[3][2], rowIndices[3][1], rowIndices[3][0]]
      .map((i) => pickedTokens[i])
      .join(' '),
  ];

  const options: string[] = [];
  let dIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (i === correctOptionIndex) {
      options.push(correctCode);
    } else {
      options.push(distractorCodes[dIdx++]);
    }
  }

  return {
    id,
    title: `${chosenCipher.label} #${Math.floor(100 + Math.random() * 900)}`,
    category: 'cipher',
    subStyleLabel: chosenCipher.label,
    gradeLevel,
    difficulty,
    questionPrompt: chosenCipher.prompt,
    correctOptionIndex,
    explanation:
      'Her sembolün kod karşılığını bulup şifreyi çözdüysen cevabını yorumlara yaz!',
    voiceoverQuestion: `Bilsem Junior ${gradeLevel} şifreleme mantığı sorusu! Her sembol bir kodu temsil ediyor. En alttaki sembollerin şifresini beş saniyede çözebilir misin?`,
    voiceoverAnswer:
      'Süre doldu! Şifreyi çözebildin mi? Bulduğun şıkkı hemen yorumlara yaz, bakalım kimler doğru bildi!',
    caption: `🔐 Şifreyi 5 saniyede çözebilenler burada mı? BİLSEM (${gradeLevel} · ${chosenCipher.label}) sorumuzun cevabını yorumlara bırakın! 💡`,
    hashtags: [
      '#bilsem',
      '#bilsemjunior',
      '#şifreleme',
      '#mantıksorusu',
      '#zekasorusu',
    ],
    createdAt: new Date().toISOString(),
    cipherSpec: {
      rows,
      options,
    },
  };
}

/**
 * Generates a full 1-Month (30-Day) Balanced Mixed Schedule Queue
 * Rotates Grade Levels (1-3. Sınıf), Topics (4 categories), Sub-Styles (12 styles),
 * Difficulties (Kolay/Orta/Zor), Scene Themes (4 themes), and Music Tracks (4 tracks)
 * so consecutive days never repeat the same combination.
 */
export function generate30DayMixedSchedule(
  dailyPublishTime = '18:00'
): {
  schedule: ScheduledReelItem[];
  puzzles: BilsemPuzzle[];
} {
  const today = new Date();
  const schedule: ScheduledReelItem[] = [];
  const puzzles: BilsemPuzzle[] = [];

  for (let dayIdx = 0; dayIdx < 30; dayIdx++) {
    const category = ALL_CATEGORIES[dayIdx % ALL_CATEGORIES.length];
    const grade = ALL_GRADES[(dayIdx + Math.floor(dayIdx / 4)) % ALL_GRADES.length];
    const difficulty =
      ALL_DIFFICULTIES[(dayIdx + Math.floor(dayIdx / 3)) % ALL_DIFFICULTIES.length];
    const themeId = ALL_THEMES[(dayIdx + Math.floor(dayIdx / 2)) % ALL_THEMES.length];
    const musicTrack =
      ALL_AUTO_MUSIC_TRACKS[
        (dayIdx + Math.floor(dayIdx / 5)) % ALL_AUTO_MUSIC_TRACKS.length
      ];
    const styleSeed = dayIdx % 3;

    const puzzle = generateProceduralBilsemPuzzle(
      category,
      grade,
      difficulty,
      styleSeed
    );
    puzzles.push(puzzle);

    const d = new Date(today);
    d.setDate(today.getDate() + dayIdx);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    schedule.push({
      id: `sched-30d-${Date.now()}-${dayIdx}`,
      dayNumber: dayIdx + 1,
      scheduledDate: `${yyyy}-${mm}-${dd}`,
      scheduledTime: dailyPublishTime,
      status: dayIdx === 0 ? 'Hazır' : 'Sırada',
      puzzle,
      themeId,
      musicTrack,
    });
  }

  return { schedule, puzzles };
}
