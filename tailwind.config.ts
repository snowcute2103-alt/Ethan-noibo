import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1A2745',
        'navy-2': '#233252',
        'navy-deep': '#101A30',
        blue: '#0052CC',
        'blue-cta': '#2D6FF0',
        gold: '#F5A623',
        'gold-2': '#FFC94D',
        cyan: '#00D2FF',
        ink: '#333333',
        muted: '#5A6B82',
        surface: '#FFFFFF',
        'surface-2': '#F4F7F9',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        baskerville: ['var(--font-baskerville)', 'serif'],
        script: ['var(--font-script)', 'cursive'],
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
      },
    },
  },
  plugins: [],
};

export default config;
