/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Athens taxi yellow + Hellenic blue
        notos: {
          yellow: '#FFC72C',
          'yellow-deep': '#F2A900',
          blue: '#0B3D91',
          'blue-deep': '#06245A',
          ink: '#0E0E10',
          paper: '#FAF7EE'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 0 rgba(11,61,145,0.06), 0 12px 32px -16px rgba(11,61,145,0.18)'
      }
    }
  },
  plugins: []
};
