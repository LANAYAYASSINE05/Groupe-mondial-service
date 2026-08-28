/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(255 255 255 / <alpha-value>)",
        charcoal: "rgb(255 255 255 / <alpha-value>)",
        surface: "rgb(245 245 245 / <alpha-value>)",
        surface2: "rgb(238 238 238 / <alpha-value>)",
        brand: {
          dark: "rgb(141 42 38 / <alpha-value>)",
          DEFAULT: "rgb(209 58 52 / <alpha-value>)",
          light: "rgb(232 90 84 / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(209 58 52 / <alpha-value>)",
          bright: "rgb(232 90 84 / <alpha-value>)",
          dim: "rgb(209 58 52 / 0.12)",
        },
        mist: "rgb(26 26 26 / <alpha-value>)",
        mute: "rgb(102 102 102 / <alpha-value>)",
        na: "rgb(153 153 153 / <alpha-value>)",
        ok: "rgb(61 143 110 / <alpha-value>)",
        audit: "rgb(141 42 38 / <alpha-value>)",
        passager: "rgb(26 111 154 / <alpha-value>)",
        report: "rgb(194 120 10 / <alpha-value>)",
        line: "rgb(0 0 0 / 0.08)",
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-plex)", "sans-serif"],
      },
      letterSpacing: {
        brand: "0.28em",
        section: "0.2em",
        label: "0.16em",
      },
      maxWidth: {
        shell: "72rem",
      },
      backgroundImage: {
        "brand-metal":
          "linear-gradient(135deg, #8D2A26 0%, #D13A34 55%, #E85A54 100%)",
        "gold-hairline":
          "linear-gradient(90deg, transparent, rgba(209,58,52,0.35), transparent)",
        "app-glow":
          "radial-gradient(ellipse 70% 50% at 10% 0%, rgba(209,58,52,0.08), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 80%, rgba(245,245,245,0.9), transparent 50%)",
      },
      transitionDuration: {
        brand: "220ms",
      },
    },
  },
  plugins: [],
};
