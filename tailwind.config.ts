import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./index.html",
  ],
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
      fontFamily: {
        // Fix Hindi text corruption: Mukta/Yantramanav as default sans-serif
        // so `font-sans` class renders Devanagari correctly everywhere
        sans: ['Mukta', 'Yantramanav', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Yantramanav', 'Mukta', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
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
        // Spiritual app palette — consistent design tokens (4.1)
        spiritual: {
          gold: "#D4A843",
          goldlight: "#F5E6C8",
          golddark: "#B8860B",
          saffron: "#FF9933",
          crimson: "#DC143C",
          teal: "#0D9488",
          indigo: "#4F46E5",
          rose: "#E11D48",
          amber: "#F59E0B",
          cyan: "#06B6D4",
        },
      },
      spacing: {
        // 4px grid spacing scale (4.1)
        '1.5': '6px',
        '4.5': '18px',
        '7.5': '30px',
        '10': '40px',
        '11': '44px',
        '12.5': '50px',
        '17.5': '70px',
      },
      fontSize: {
        // Consistent typography scale — increased by 1pt overall
        'xs': ['11px', { lineHeight: '15px' }],
        'sm': ['13px', { lineHeight: '17px' }],
        'base': ['15px', { lineHeight: '21px' }],
        'lg': ['17px', { lineHeight: '25px' }],
        'xl': ['19px', { lineHeight: '27px' }],
        '2xl': ['23px', { lineHeight: '29px' }],
        '3xl': ['29px', { lineHeight: '35px' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        // Consistent shadow scale (4.1)
        'card': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
        'modal': '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        'glow-gold': '0 0 15px rgba(212,168,67,0.3)',
        'glow-teal': '0 0 15px rgba(13,148,136,0.3)',
        'glow-rose': '0 0 15px rgba(225,29,72,0.3)',
        'bottom-bar': '0 -1px 3px rgba(0,0,0,0.1)',
      },
      animation: {
        // Consistent animation presets (4.1)
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
