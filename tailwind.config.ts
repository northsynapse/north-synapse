
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f1ff",
          100: "#ebe2ff",
          500: "#9560ff",
          600: "#8250ed",
          700: "#6938ca",
        },
        ink: {
          900: "#172554",
          800: "#1e293b",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 4px 24px rgba(30, 41, 59, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
