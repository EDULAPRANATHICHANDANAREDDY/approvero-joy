export type SoundTheme = "classic" | "minimal" | "modern";
export type SoundEvent = "approve" | "reject";

const STORAGE_KEY = "approvex_sound_settings_v1";

export interface SoundSettings {
  enabled: boolean;
  theme: SoundTheme;
}

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  theme: "classic",
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getSoundSettings(): SoundSettings {
  const stored = safeJsonParse<Partial<SoundSettings>>(localStorage.getItem(STORAGE_KEY));
  return {
    enabled: stored?.enabled ?? DEFAULT_SETTINGS.enabled,
    theme: (stored?.theme as SoundTheme) ?? DEFAULT_SETTINGS.theme,
  };
}

export function setSoundSettings(next: SoundSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("approvex:sound-settings", { detail: next }));
}

let audioCtx: AudioContext | null = null;
let unlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

async function unlockAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // ignore
    }
  }
  unlocked = ctx.state === "running";
}

// Respect autoplay policies: we only unlock after a user gesture.
export function installSoundAutoplayUnlock() {
  if (typeof window === "undefined") return;
  const handler = async () => {
    await unlockAudioContext();
    if (unlocked) {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    }
  };
  window.addEventListener("pointerdown", handler, { once: false, passive: true });
  window.addEventListener("keydown", handler, { once: false });
}

type ToneSpec = {
  freq: number;
  durationMs: number;
  type?: OscillatorType;
  gain: number;
  attackMs: number;
  releaseMs: number;
};

function themeSpecs(theme: SoundTheme, event: SoundEvent): ToneSpec[] {
  // Short, subtle, enterprise-friendly tones.
  if (theme === "minimal") {
    return event === "approve"
      ? [{ freq: 880, durationMs: 120, type: "sine", gain: 0.05, attackMs: 6, releaseMs: 80 }]
      : [{ freq: 220, durationMs: 140, type: "triangle", gain: 0.06, attackMs: 6, releaseMs: 90 }];
  }

  if (theme === "modern") {
    return event === "approve"
      ? [
          { freq: 660, durationMs: 90, type: "sine", gain: 0.06, attackMs: 4, releaseMs: 60 },
          { freq: 990, durationMs: 110, type: "sine", gain: 0.05, attackMs: 6, releaseMs: 70 },
        ]
      : [
          { freq: 260, durationMs: 90, type: "triangle", gain: 0.06, attackMs: 4, releaseMs: 60 },
          { freq: 200, durationMs: 120, type: "triangle", gain: 0.06, attackMs: 6, releaseMs: 80 },
        ];
  }

  // classic
  return event === "approve"
    ? [
        { freq: 523.25, durationMs: 90, type: "sine", gain: 0.06, attackMs: 5, releaseMs: 60 },
        { freq: 783.99, durationMs: 140, type: "sine", gain: 0.05, attackMs: 8, releaseMs: 90 },
      ]
    : [
        { freq: 196.0, durationMs: 120, type: "triangle", gain: 0.07, attackMs: 6, releaseMs: 90 },
        { freq: 146.83, durationMs: 160, type: "triangle", gain: 0.07, attackMs: 10, releaseMs: 110 },
      ];
}

export async function playSound(event: SoundEvent) {
  const settings = getSoundSettings();
  if (!settings.enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Autoplay policy: if the context is still suspended, we bail silently.
  if (ctx.state !== "running") return;

  const startAt = ctx.currentTime + 0.01;
  const chain = themeSpecs(settings.theme, event);

  chain.forEach((spec, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.type ?? "sine";
    osc.frequency.setValueAtTime(spec.freq, startAt);

    const toneStart = startAt + idx * 0.06;
    const attack = spec.attackMs / 1000;
    const release = spec.releaseMs / 1000;
    const duration = spec.durationMs / 1000;

    gain.gain.setValueAtTime(0, toneStart);
    gain.gain.linearRampToValueAtTime(spec.gain, toneStart + attack);
    gain.gain.linearRampToValueAtTime(0.0001, toneStart + duration + release);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(toneStart);
    osc.stop(toneStart + duration + release + 0.02);
  });
}
