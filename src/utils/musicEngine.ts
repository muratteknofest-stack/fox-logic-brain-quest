import { MusicTrackId } from '../types/puzzle';

export const MUSIC_TRACK_LABELS: Record<
  MusicTrackId,
  { name: string; subtitle: string }
> = {
  quiz_show: {
    name: 'Yarışma Ritmi',
    subtitle: 'TV bilgi yarışması temposu',
  },
  playful_marimba: {
    name: 'Neşeli Melodiler',
    subtitle: 'Çocuk dostu marimba & ksilofon',
  },
  lofi_focus: {
    name: 'Lo-Fi Odak',
    subtitle: 'Sakin odaklanma & düşünme ritmi',
  },
  cosmic_synth: {
    name: 'Uzay Sentezi',
    subtitle: 'Bilim ve keşif atmosferi',
  },
  custom_mp3: {
    name: 'Özel MP3',
    subtitle: 'Kendi yüklediğiniz ses dosyası',
  },
  none: {
    name: 'Müziksiz',
    subtitle: 'Sadece seslendirme ve efektler',
  },
};

export interface BackgroundMusicController {
  stop: () => void;
}

export function startBackgroundMusic(
  ctx: AudioContext,
  destination: AudioNode,
  trackId: MusicTrackId,
  volumePercent: number,
  durationSeconds = 15
): BackgroundMusicController {
  if (trackId === 'none' || volumePercent <= 0) {
    return { stop: () => {} };
  }

  const masterGain = ctx.createGain();
  const normalizedVol = Math.max(0, Math.min(1, volumePercent / 100)) * 0.25;
  masterGain.gain.setValueAtTime(normalizedVol, ctx.currentTime);
  masterGain.connect(destination);

  const scheduledNodes: AudioScheduledSourceNode[] = [];
  const startTime = ctx.currentTime + 0.02;
  const endTime = startTime + durationSeconds;

  const patterns: Record<
    Exclude<MusicTrackId, 'none' | 'custom_mp3'>,
    { notes: number[]; stepSec: number; wave: OscillatorType }
  > = {
    quiz_show: {
      notes: [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23],
      stepSec: 0.25,
      wave: 'triangle',
    },
    playful_marimba: {
      notes: [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 783.99, 523.25],
      stepSec: 0.22,
      wave: 'sine',
    },
    lofi_focus: {
      notes: [220.0, 261.63, 329.63, 293.66, 246.94, 293.66, 329.63, 220.0],
      stepSec: 0.4,
      wave: 'sine',
    },
    cosmic_synth: {
      notes: [196.0, 293.66, 392.0, 440.0, 392.0, 293.66, 261.63, 329.63],
      stepSec: 0.3,
      wave: 'triangle',
    },
  };

  const chosen =
    patterns[trackId === 'custom_mp3' ? 'quiz_show' : trackId] ||
    patterns.quiz_show;

  let t = startTime;
  let stepIdx = 0;

  while (t < endTime) {
    const freq = chosen.notes[stepIdx % chosen.notes.length];
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = chosen.wave;
    osc.frequency.setValueAtTime(freq, t);

    noteGain.gain.setValueAtTime(0.001, t);
    noteGain.gain.exponentialRampToValueAtTime(0.6, t + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + chosen.stepSec * 0.9);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(t);
    osc.stop(t + chosen.stepSec);
    scheduledNodes.push(osc);

    t += chosen.stepSec;
    stepIdx++;
  }

  return {
    stop: () => {
      try {
        masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
      } catch {
        // ignore
      }
      for (const node of scheduledNodes) {
        try {
          node.stop();
        } catch {
          // ignore
        }
      }
    },
  };
}
