/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#ffffff",
          panel: "#ffffff",
          panelSoft: "#f8fafc",
          indigo: "#6366f1",
          electric: "#4f46e5",
          cyan: "#4338ca",
          text: "#111111",
          muted: "#4b5563",
        },
      },
    },
  },
  plugins: [],
};
