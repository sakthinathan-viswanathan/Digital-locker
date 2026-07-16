/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0F1B33",
          light: "#1B2A4A",
        },
        brass: {
          DEFAULT: "#C6952C",
          light: "#E3B94D",
          dark: "#9C7420",
        },
        canvas: "#F6F5F1",
        muted: "#6B7280",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 27, 51, 0.06), 0 1px 3px rgba(15, 27, 51, 0.08)",
        panel: "0 4px 24px rgba(15, 27, 51, 0.10)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
