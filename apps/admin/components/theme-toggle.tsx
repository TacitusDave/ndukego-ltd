"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Deferred so the mount flag never sets synchronously inside the effect.
  useEffect(() => { void Promise.resolve().then(() => setMounted(true)); }, []);
  if (!mounted) return <div className="h-8 w-8" />;

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  const current = options.find((o) => o.value === theme) ?? options[1];
  const Icon = current.icon;

  function cycleTheme() {
    const idx = options.findIndex((o) => o.value === theme);
    const next = options[(idx + 1) % options.length];
    setTheme(next.value);
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Theme: ${current.label} — click to cycle`}
      className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors duration-150"
      aria-label="Toggle theme"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
