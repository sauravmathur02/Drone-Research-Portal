/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#050914',
        panel: 'rgba(10, 15, 30, 0.7)',
        border: 'rgba(0, 243, 255, 0.2)',
        neon: '#00f3ff',
        'neon-glow': 'rgba(0, 243, 255, 0.5)',
        textMain: '#e0e6ed',
        textMuted: '#8b9bb4',
        danger: '#ff3366',
        warning: '#ff9933',
        success: '#00ff66',
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        data: ['Roboto Mono', 'monospace'],
      },
      backdropBlur: {
        glass: '12px',
      }
    },
  },
  plugins: [],
}
