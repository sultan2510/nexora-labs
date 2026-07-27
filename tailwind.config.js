/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        surface: "#121212",
        surface2: "#181818",
        border: "#262626",
        red: {
          DEFAULT: "#E11D2E",
          dark: "#B3121F",
          light: "#FF4D5E",
        },
        muted: "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
