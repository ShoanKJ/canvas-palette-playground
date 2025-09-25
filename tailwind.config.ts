import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Canvas-specific colors
        canvas: {
          bg: "hsl(var(--canvas-bg))",
          surface: "hsl(var(--canvas-surface))",
          panel: "hsl(var(--canvas-panel))",
          "panel-elevated": "hsl(var(--canvas-panel-elevated))",
          border: "hsl(var(--canvas-border))",
          hover: "hsl(var(--canvas-hover))",
          active: "hsl(var(--canvas-active))",
          text: "hsl(var(--canvas-text))",
          "text-muted": "hsl(var(--canvas-text-muted))",
          accent: "hsl(var(--canvas-accent))",
          "accent-light": "hsl(var(--canvas-accent-light))",
          success: "hsl(var(--canvas-success))",
          warning: "hsl(var(--canvas-warning))",
          error: "hsl(var(--canvas-error))",
        },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-surface": "var(--gradient-surface)",
        "gradient-panel": "var(--gradient-panel)",
      },
      boxShadow: {
        "canvas-soft": "var(--shadow-soft)",
        "canvas-medium": "var(--shadow-medium)",
        "canvas-strong": "var(--shadow-strong)",
        "canvas-glow": "var(--shadow-glow)",
      },
      transitionTimingFunction: {
        "ease-smooth": "var(--ease-smooth)",
        "ease-bounce": "var(--ease-bounce)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
