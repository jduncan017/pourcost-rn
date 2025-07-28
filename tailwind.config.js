/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 + Tailwind v3 configuration
  // Structured for easy migration to v5 + v4 when stable
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],

  // Enable dark mode with class strategy
  darkMode: 'class',

  // Ensure proper web support
  mode: 'jit',
  important: true,
  theme: {
    extend: {
      // PourCost brand colors based on design guide
      colors: {
        // Primary colors
        p1: '#3262C2',
        p2: '#2C3E63',
        p3: '#1D273C',
        p4: '#041021',

        // Neutral colors
        n1: '#FFFFFF',
        n2: '#FCF9ED',
        n3: '#ECE7D1',
        n4: '#CEC59D',

        // Grey colors
        g1: '#EEEEEE',
        g2: '#AFAFAF',
        g3: '#585858',
        g4: '#111111',

        // Secondary yellows
        s11: '#FBE09D',
        s12: '#DCB962',
        s13: '#AF8827',
        s14: '#694920',

        // Secondary teals
        s21: '#51CCAE',
        s22: '#439883',
        s23: '#286052',
        s24: '#062920',

        // Secondary purples
        s31: '#7663E7',
        s32: '#594DA5',
        s33: '#382E78',
        s34: '#251C5F',

        // Error/caution colors (reds)
        e1: '#D63663', // Light red/pink
        e2: '#B0244B', // Base color (provided)
        e3: '#780A29', // Dark red
        e4: '#4C0015', // Very dark red
      },
      // Custom font family for PourCost
      fontFamily: {
        geist: ['Geist', 'system-ui', 'sans-serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'], // Default to Geist
      },
      // Custom spacing for mobile-first design
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      // Custom shadows
      boxShadow: {
        4: '4px 4px 8px rgba(0, 0, 0, 0.5)',
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
