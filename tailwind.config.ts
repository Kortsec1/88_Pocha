import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#080B10",
        surface: "#111827",
        elevated: "#172033",
        border: "#263244",
        primary: "#F8FAFC",
        secondary: "#94A3B8",
        accent: "#4F8CFF",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(0,0,0,0.32)",
      },
    },
  },
  plugins: [],
};

export default config;
