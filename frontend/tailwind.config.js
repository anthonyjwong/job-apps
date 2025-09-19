/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind v4 uses CSS for configuration
  // All theme and styling configuration is in styles/globals.css
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './App.tsx',
  ],
};