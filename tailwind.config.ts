import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA",
        surface: "#FFFFFF",
        elevated: "#F1F3F5",
        border: "#E5E8EB",
        primary: "#191F28",
        secondary: "#6B7684",
        accent: "#C9151E",
        success: "#15803D",
        warning: "#F59E0B",
        danger: "#C9151E",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(25,31,40,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
