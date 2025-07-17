/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 + Tailwind v3 configuration
  // Structured for easy migration to v5 + v4 when stable
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  
  // Ensure proper web support
  mode: 'jit',
  important: true,
  theme: {
    extend: {
      // PourCost brand colors (structured for v4 migration)
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Additional PourCost colors
        accent: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
      },
      // Custom font family for PourCost
      fontFamily: {
        'display': ['Orator', 'serif'],
      },
      // Custom spacing for mobile-first design
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
  
  // Future v4 migration notes:
  // When migrating to v4, this config will become CSS-based:
  // - Colors will move to @theme in global.css
  // - Content detection will be automatic
  // - Presets will be handled differently
};