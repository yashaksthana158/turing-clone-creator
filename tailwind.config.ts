import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "cosmic-dark": "hsl(var(--cosmic-dark))",
        "cosmic-light": "hsl(var(--cosmic-light))",
        "cosmic-purple": "hsl(var(--cosmic-purple))",
        "cosmic-blue": "hsl(var(--cosmic-blue))",
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
