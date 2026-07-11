import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#0b6e3b",
          dark: "#064d29",
          light: "#16a34a",
          deep: "#07150e",
          card: "#0c2217",
          border: "#163e2a",
        },
        gold: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
          light: "#fbbf24",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
