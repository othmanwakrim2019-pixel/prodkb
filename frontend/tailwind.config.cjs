/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            borderRadius: {
                'none': '0',
                'sm': '2px',
                DEFAULT: '3px',
                'md': '3px',
                'lg': '4px',
                'xl': '4px',
                '2xl': '4px',
                '3xl': '4px',
                'full': '9999px',
            },
            colors: {
                primary: {
                    DEFAULT: '#003d82', // CIH Blue
                    hover: '#002856',
                    light: '#818cf8'
                },
                secondary: {
                    DEFAULT: '#1D2125', // Jira Dark Mode Base
                    dark: '#161A1D'
                },
                accent: {
                    DEFAULT: '#ff6b35', // CIH Orange
                    hover: '#e85d2b',
                    light: '#ff895e'
                },
                slate: {
                    ...require('tailwindcss/colors').slate,
                    700: '#2C333A', // Jira Raised Surface
                    800: '#22272B', // Jira Surface
                    900: '#1D2125', // Jira Background
                    950: '#161A1D',
                },
                'cih-blue': '#003d82',
                'cih-orange': '#ff6b35',
            }
        },
    },
    plugins: [],
}
