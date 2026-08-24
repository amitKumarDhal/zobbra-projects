/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-heading)', 'serif'], // Backward compat alias
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        // ─── Canonical Zobra Brand (ACTIVE PRODUCTION) ──────────────────
        brand: {
          DEFAULT: '#3B6FEB',
          hover: '#2563EB',
          active: '#1D4ED8',
          soft: '#EEF2FF',
        },
        // ─── Canonical Surface & Neutral ────────────────────────────────
        dark: {
          DEFAULT: '#111111',
          sidebar: '#0A0F1C',
          black: '#050505',
        },
        app: {
          bg: '#F8F9FC',
          subtle: '#F9FAFB',
        },
        // ─── Canonical Borders ───────────────────────────────────────────
        border: {
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
          subtle: '#F3F4F6',
        },
        // ─── Legacy Prototype Colors (DO NOT USE IN NEW CODE) ────────────
        // Kept ONLY for backward compatibility in existing public/customer UI
        terracotta: {
          DEFAULT: '#C75B39',
          hover: '#B44F2F',
          light: '#FDF2EE',
        },
        deepteal: {
          DEFAULT: '#1A5653',
          dark: '#123D3B',
          light: '#246F6B',
        },
        gold: {
          DEFAULT: '#D4A953',
          light: '#FBF5E8',
        },
        ivory: {
          DEFAULT: '#F7F5F2',
          card: '#FFFFFF',
          border: '#E7E3DD',
        },
      },
      borderRadius: {
        '3xl': '20px',
        '4xl': '28px',
      },
    },
  },
  plugins: [],
};
