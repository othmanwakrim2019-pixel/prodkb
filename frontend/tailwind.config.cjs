/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#003d82', // CIH Bank Blue (trust, experience)
                secondary: '#002856', // CIH Bank Dark Blue
                accent: '#ff6b35', // CIH Bank Orange (innovation, modern)
                'cih-blue': '#003d82',
                'cih-orange': '#ff6b35',
            }
        },
    },
    plugins: [],
}
