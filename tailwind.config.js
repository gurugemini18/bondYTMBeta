/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#3B82F6',
        'brand-cyan': '#22D3EE',
        'night-bg': '#0F172A',
        'night-card': '#1E293B',
        'night-border': '#334155',
        'night-text': '#E2E8F0',
        'night-text-light': '#94A3B8',
      },
    },
  },
  plugins: [],
}
