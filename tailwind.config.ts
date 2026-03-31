import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: '#1e2952',
        'medical-navy': '#1e2952',
        'medical-green': '#76c8b6',
        'medical-teal': '#469993',
        'medical-orange': '#efc462',
        'medical-coral': '#eb8966',
        'medical-light-green': '#e6f5f2',
        'medical-text-gray': '#4b5563',
      },
      backgroundColor: {
        'medical-navy': '#1e2952',
        'medical-green': '#a8d5ba',
      },
    },
  },
  plugins: [],
}
export default config
