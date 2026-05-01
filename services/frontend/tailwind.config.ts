// services/frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  // ── Content sources ─────────────────────────────────────────────────────────
  // Tailwind scans these files for class names to include in the final bundle.
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}", // retained for any pages/ fallback
  ],

  // ── Dark mode ───────────────────────────────────────────────────────────────
  // "class" strategy: add/remove `dark` class on <html> to toggle.
  // This lets us support user-preference toggles without OS-level detection.
  darkMode: "class",

  theme: {
    extend: {
      // ── Colors ──────────────────────────────────────────────────────────────
      // Semantic aliases on top of the Tailwind slate/blue palette.
      // Use these for consistent theming across components.
      colors: {
        // Primary action color (matches #3b82f6 from design spec)
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Sidebar background (#1e293b from design spec = slate-800)
        sidebar: "#1e293b",
      },

      // ── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        // System font stack — no external font loading required
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
        mono: [
          '"SFMono-Regular"',
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },

      // ── Font sizes ──────────────────────────────────────────────────────────
      // Fine-grained sizes for dense UI (11px, 12px, 13px are used throughout)
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],  // 10px
        xs:    ["0.6875rem", { lineHeight: "1rem" }],      // 11px
        sm:    ["0.75rem", { lineHeight: "1.125rem" }],    // 12px
        base:  ["0.8125rem", { lineHeight: "1.25rem" }],   // 13px (body default)
        md:    ["0.875rem", { lineHeight: "1.375rem" }],   // 14px
        lg:    ["1rem", { lineHeight: "1.5rem" }],         // 16px
        xl:    ["1.125rem", { lineHeight: "1.75rem" }],    // 18px
        "2xl": ["1.25rem", { lineHeight: "1.875rem" }],    // 20px
        "3xl": ["1.5rem", { lineHeight: "2rem" }],         // 24px
      },

      // ── Spacing ─────────────────────────────────────────────────────────────
      spacing: {
        "sidebar":          "240px",  // expanded sidebar width
        "sidebar-collapsed": "60px",  // collapsed sidebar width
        "header":           "60px",   // header height
      },

      // ── Border radius ────────────────────────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
      },

      // ── Box shadows ──────────────────────────────────────────────────────────
      boxShadow: {
        // Subtle card lift
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        // Modal
        modal: "0 20px 60px -10px rgb(0 0 0 / 0.2), 0 4px 20px -4px rgb(0 0 0 / 0.1)",
        // Dropdown
        dropdown: "0 8px 24px -4px rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.08)",
      },

      // ── Animation ────────────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to:   { opacity: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in":        "fade-in 0.15s ease-out",
        "fade-out":       "fade-out 0.1s ease-in",
        "slide-in-right": "slide-in-right 0.2s ease-out",
        "pulse-soft":     "pulse-soft 2s ease-in-out infinite",
      },

      // ── Transitions ──────────────────────────────────────────────────────────
      transitionProperty: {
        "width": "width",
        "sidebar": "width, min-width, margin-left",
      },
    },
  },

  plugins: [
    // Add @tailwindcss/forms if you need better default form styling:
    // require("@tailwindcss/forms"),
    //
    // Add @tailwindcss/typography for prose content:
    // require("@tailwindcss/typography"),
  ],
};

export default config;
