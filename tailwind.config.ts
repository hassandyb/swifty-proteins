/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:      'var(--color-bg)',
        card:    'var(--color-card)',
        border:  'var(--color-border)',
        accent:  'var(--color-accent)',
        muted:   'var(--color-muted)',
        success: 'var(--color-success)',
        danger:  'var(--color-danger)',
        warning: 'var(--color-warning)',
        bar:     'var(--color-bar)',
      },
    },
  },
  plugins: [],
};