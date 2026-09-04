import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: 'var(--navy)',
        'navy-2': 'var(--navy-2)',
        'navy-deep': 'var(--navy-deep)',
        blue: 'var(--blue)',
        'blue-cta': 'var(--blue-cta)',
        gold: 'var(--gold)',
        'gold-2': 'var(--gold-2)',
        cyan: 'var(--cyan)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        'destructive-soft': 'var(--destructive-soft)',
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        'success-soft': 'var(--success-soft)',
        'warning-soft': 'var(--warning-soft)',
        'warning-foreground': 'var(--warning-foreground)',
        'info-soft': 'var(--info-soft)',
        input: 'var(--input)',
        ring: 'var(--ring)',
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
