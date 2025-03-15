import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      tiny: "0.375rem",
      xs: "0.5rem",
      sm: "0.625rem",
      md: "0.75rem",
      base: "0.875rem",
      lg: "1rem",
      elg: "1.125rem",
      xl: "1.25rem",
      exl: "1.375rem",
      "2xl": "1.5rem",
      e2xl: "1.625rem",
      "3xl": "1.75rem",
      e3xl: "1.875rem",
      "4xl": "2rem",
      e4xl: "2.125rem",
      "5xl": "2.25rem",
      e5xl: "2.375rem",
      "6xl": "2.5rem",
      e6xl: "2.625rem",
      "7xl": "3rem",
      e7xl: "3.125rem",
      "8xl": "3.325rem",
      e8xl: "3.5rem",
      "9xl": "3.625rem",
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
        },
        brandSolid: {
          DEFAULT: "hsl(var(--brand-solid))",
          foreground: "hsl(var(--brand-solid-foreground))",
        },
        teriary: {
          DEFAULT: "hsl(var(--teriary))",
          foreground: "hsl(var(--teriaryforeground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        borderSecondary: "hsl(var(--border-secondary))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        navigation: "hsl(var(--navigation))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config;
