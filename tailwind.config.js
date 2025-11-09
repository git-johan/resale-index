/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sf-pro': [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'system-ui',
          'sans-serif'
        ],
      },
      spacing: {
        '8pt': '8pt',
        '10pt': '10pt',
        '11pt': '11pt',
        '12pt': '12pt',
        '15pt': '15pt',
        '18pt': '18pt',
        '24pt': '24pt',
        '30pt': '30pt',
        '33pt': '33pt',
        '7.5pt': '7.5pt',
        '5pt': '5pt',
        '6pt': '6pt',
      },
      fontSize: {
        '9pt': '9pt',
        '10pt': '10pt',
        '11pt': '11pt',
        '13pt': '13pt',
        '18pt': '18pt',
        '20pt': '20pt',
        '24pt': '24pt',
        '33pt': '33pt',
      },
      colors: {
        'brand-dark': '#353535',
        'brand-darker': '#121212',
        'brand-gray': '#9a9a9a',
        'brand-gray-dark': '#666666',
        'text-secondary': '#787878',
        'text-primary': '#ffffff',
        'border-subtle': '#2c2c2c',
        'exclusion-bg': '#470000',
      },
      lineHeight: {
        '1.1': '1.1',
        '1.2': '1.2',
        '1.3': '1.3',
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      }
    },
  },
  plugins: [],
}