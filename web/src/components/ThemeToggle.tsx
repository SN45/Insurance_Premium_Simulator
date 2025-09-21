import { useEffect, useState } from 'react';

function isDark() {
  return document.documentElement.classList.contains('dark');
}
function applyTheme(dark: boolean) {
  const html = document.documentElement;
  html.classList.toggle('dark', dark);
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

export default function ThemeToggle() {
  // initialize from saved/system
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const startDark = saved ? saved === 'dark' : prefers;
    applyTheme(startDark);
  }, []);

  // local tick for label + notify others
  const [, setTick] = useState(0);

  const toggle = () => {
    const next = !isDark();
    applyTheme(next);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark: next } }));
    setTick(t => t + 1);
  };

  const dark = isDark();
  return (
    <button
      onClick={toggle}
      className="px-3 py-2 rounded-lg border text-sm bg-white/70 dark:bg-black/30 dark:text-white"
      title="Toggle theme"
    >
      {dark ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
