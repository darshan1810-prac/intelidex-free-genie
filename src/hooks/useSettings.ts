import { useState, useEffect } from "react";
import type { UserSettings } from "@/types/crypto";

const DEFAULT_SETTINGS: UserSettings = {
  favoriteCoins: ["bitcoin", "ethereum", "binancecoin"],
  refreshInterval: 30000,
  theme: "dark",
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = localStorage.getItem("intellidex-settings");
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("intellidex-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
};
