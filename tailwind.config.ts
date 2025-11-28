import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          deep: "#0a0f0a",
          dark: "#1a2e1a",
        },
        text: {
          primary: "#f5f5f5",
        },
      },
    },
  },
  plugins: [],
};

export default config;
