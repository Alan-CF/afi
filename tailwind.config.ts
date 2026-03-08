import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F4C430",
        "primary-dark": "#C99E22",

        secondary: "#2F6FED",

        surface: {
          dark: "#2B3A4A",
          light: "#E6EEF6",
        },

        background: "#F8F9FB",

        destructive: "#E53935",
        "destructive-dark": "#C62828",

        success: "#2ECC71",

        text: {
          DEFAULT: "#111111",
          light: "#888888",
        },
      },

      fontSize: {
        heading1: ["36px", { lineHeight: "auto" }],
        heading2: ["32px", { lineHeight: "auto" }],
        heading3: ["28px", { lineHeight: "auto" }],
        heading4: ["24px", { lineHeight: "auto" }],
        heading5: ["24px", { lineHeight: "auto" }],

        "text-regular": ["18px", { lineHeight: "auto" }],
        "text-regular-2": ["16px", { lineHeight: "auto" }],

        links: ["14px", { lineHeight: "auto" }],
        small: ["10px", { lineHeight: "auto" }],
      },
      
      fontFamily: {
        anton: ["Anton", "sans-serif"],
        lato: ["Lato", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;