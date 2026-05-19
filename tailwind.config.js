/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep':     '#0B0B0F',
        'bg-card':     '#12121A',
        'bg-surface':  '#1A1A26',
        'border-dim':  '#1E1E2E',
        'border-glow': '#2E2E4A',
        fire:   '#FF6B35',
        water:  '#4FC3F7',
        earth:  '#81C784',
        gold:   '#FFD700',
        purple: '#CE93D8',
        red:    '#EF5350',
        green:  '#66BB6A',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'system-ui', 'Roboto', 'sans-serif',
        ],
      },
      boxShadow: {
        fire:  '0 0 12px rgba(255,107,53,0.4)',
        water: '0 0 12px rgba(79,195,247,0.4)',
        earth: '0 0 12px rgba(129,199,132,0.4)',
        gold:  '0 0 12px rgba(255,215,0,0.3)',
      },
    },
  },
  plugins: [],
}
