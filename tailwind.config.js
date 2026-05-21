/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        border: "rgb(42, 42, 50)",
        background: "rgb(15, 15, 17)",
        foreground: "rgb(228, 228, 231)",
        primary: {
          DEFAULT: "#C8F15E",
          foreground: "#0F0F11",
        },
        baseline: {
          dark: "#0F0F11",
          "dark-2": "#141417",
          "dark-3": "#18181C",
          "dark-4": "#1F1F24",
          "dark-5": "#27272E",
          green: "#C8F15E",
          "green-dim": "#A9CE45",
          border: "#2A2A32",
          text: {
            primary: "#E4E4E7",
            secondary: "#A1A1AA",
            dim: "#71717A",
          }
        }
      },
      animation: {
        "pulse-glow": "pulse-glow 2s infinite ease-in-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: 0.6, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.1)" },
        }
      }
    },
  },
  plugins: [],
}
