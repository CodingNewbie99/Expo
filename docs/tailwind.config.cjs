const expoTheme = require('@expo/styleguide/tailwind');
const merge = require('lodash/merge');

function getExpoTheme(extend = {}, plugins = []) {
  const customizedTheme = Object.assign({}, expoTheme);
  customizedTheme.theme.extend = Object.assign({}, merge(expoTheme.theme.extend, extend));
  customizedTheme.plugins = [...expoTheme.plugins, ...plugins];
  return customizedTheme;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './ui/foundations/**/*.{js,ts,jsx,tsx}',
    './ui/components/**/*.{js,ts,jsx,tsx}',
    './scenes/**/*.{js,ts,jsx,tsx}',
    './node_modules/@expo/styleguide/dist/**/*.{js,ts,jsx,tsx}',
    './node_modules/@expo/styleguide-search-ui/dist/**/*.{js,ts,jsx,tsx}',
  ],
  ...getExpoTheme({
    backgroundImage: theme => ({
      'cell-quickstart-fade': `linear-gradient(${theme('backgroundColor.subtle')} 15%, #21262d00 100%)`,
      'cell-quickstart-pattern': "url('/static/images/home/QuickStartPattern.svg')",
      'cell-tutorial-fade': `linear-gradient(var(--blue3) 15%, #201d5200 100%)`,
      'cell-tutorial-pattern': "url('/static/images/home/TutorialPattern.svg')",
      appjs: "url('/static/images/appjs.svg'), linear-gradient(#0033cc, #0033cc)",
    }),
    keyframes: {
      wave: {
        '0%, 100%': {
          transform: 'rotate(0deg)',
        },
        '50%': {
          transform: 'rotate(20deg)',
        },
      },
    },
    animation: {
      wave: 'wave 0.25s ease-in-out 4',
    },
  }),
};
