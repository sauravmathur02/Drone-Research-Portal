/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#000000',
        panel: '#09090b',
        border: 'rgba(255, 255, 255, 0.1)',
        neon: '#38bdf8', // Premium sky blue instead of harsh cyan
        'neon-glow': 'rgba(56, 189, 248, 0.15)',
        textMain: '#ededed',
        textMuted: '#a1a1aa',
        danger: '#ef4444',
        warning: '#f5a623',
        success: '#10b981',
      },
      fontFamily: {
        heading: ['Inter', '-apple-system', 'sans-serif'],
        body: ['Inter', '-apple-system', 'sans-serif'],
        data: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      backdropBlur: {
        glass: '16px',
      }
    },
  },
  plugins: [],
}
