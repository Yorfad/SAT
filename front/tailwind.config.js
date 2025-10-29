/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: {
    extend: { colors: { brand: "var(--color-brand, #0ea5e9)" } },
  },
  plugins: [],
}
