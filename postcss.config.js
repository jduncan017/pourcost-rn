module.exports = {
  plugins: {
    // For NativeWind v4 + Tailwind v3 compatibility
    tailwindcss: {},
    autoprefixer: {},
    
    // When we migrate to v5 + v4, this will become:
    // '@tailwindcss/postcss': {},
  },
};