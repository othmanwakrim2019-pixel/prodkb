/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#003d82',
                secondary: '#002856',
                accent: '#ff6b35',
                'cih-blue': '#003d82',
                'cih-orange': '#ff6b35',
            }
        },
    },
    plugins: [],
}

