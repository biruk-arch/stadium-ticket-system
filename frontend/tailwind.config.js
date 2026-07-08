/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          night: '#0B1F17',
          ink: '#132821',
          line: '#1E362E',
          green: '#1E7145',
          bright: '#2FA968'
        },
        flood: {
          DEFAULT: '#F5B301',
          soft: '#FBD466',
          deep: '#C98B00'
        },
        chalk: {
          DEFAULT: '#F7F5EF',
          dim: '#C9D2CB'
        },
        alert: '#E14B4B'
      },
      fontFamily: {
        display: ['"Anton"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      backgroundImage: {
        'floodlight-glow': 'radial-gradient(120% 120% at 15% -10%, rgba(245,179,1,0.16) 0%, rgba(11,31,23,0) 55%)',
        'pitch-lines': 'repeating-linear-gradient(90deg, rgba(247,245,239,0.035) 0px, rgba(247,245,239,0.035) 1px, transparent 1px, transparent 64px)'
      }
    }
  },
  plugins: []
};
