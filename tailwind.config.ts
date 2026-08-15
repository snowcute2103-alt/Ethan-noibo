import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#16305C',
        'navy-2': '#1B2A4A',
        'navy-deep': '#0F2244',
        blue: '#1E7FE0',
        'blue-cta': '#2B8FFF',
        yellow: '#F4B41A',
        'yellow-2': '#FFC107',
        ink: '#1A2433',
        muted: '#5A6B82',
        surface: '#EAF3FB',
        'surface-2': '#F5F9FF',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
      },
    },
  },
  plugins: [],
};

export default config;
