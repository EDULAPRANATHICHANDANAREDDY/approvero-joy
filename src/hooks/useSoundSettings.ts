import { useEffect, useState } from "react";
import { getSoundSettings, setSoundSettings, type SoundSettings } from "@/lib/sound-engine";

export function useSoundSettings() {
  const [settings, setSettingsState] = useState<SoundSettings>(() => getSoundSettings());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SoundSettings>).detail;
      if (detail) setSettingsState(detail);
      else setSettingsState(getSoundSettings());
    };
    window.addEventListener("approvex:sound-settings", handler);
    return () => window.removeEventListener("approvex:sound-settings", handler);
  }, []);

  const update = (next: SoundSettings) => {
    setSettingsState(next);
    setSoundSettings(next);
  };

  return { settings, update };
}
