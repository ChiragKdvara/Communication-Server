// /** @type {import('tailwindcss').Config} */
// export default {
//   content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
//   theme: {
//     extend: {
//       fontFamily: {
//         poppins: ['Poppins'],
//       },
//     },
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui'
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {},
      spacing: {},
      fontFamily: {
        poppins: 'Poppins',
        space: 'Space Grotesk',
      },
      borderRadius: {
        '3xl': '22px',
        lg: '18px',
      },
    },
    fontSize: {
      lg: '1.125rem',
      base: '1rem',
      '13xl': '2rem',
      lgi: '1.188rem',
      '7xl': '1.625rem',
      '17xl': '2.25rem',
      '3xl': '1.375rem',
      '10xl': '1.813rem',
      '29xl': '3rem',
      '19xl': '2.375rem',
      xl: '1.25rem',
      inherit: 'inherit',
    },
    screens: {
      mq1150: {
        raw: 'screen and (max-width: 1150px)',
      },
      mq1050: {
        raw: 'screen and (max-width: 1050px)',
      },
      mq750: {
        raw: 'screen and (max-width: 750px)',
      },
      mq450: {
        raw: 'screen and (max-width: 450px)',
      },
      mq1560: {
        raw: 'screen and (min-width: 1200px) and (max-width: 1600px) ',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#a2c617',
          secondary: '#72310c',
          accent: '#1f1f1f',
        },
      },
      'light',
    ],
  },
}
