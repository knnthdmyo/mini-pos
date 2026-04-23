import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      minHeight: {
        touch: "48px",
      },
      fontSize: {
        touch: ["1.125rem", "1.75rem"],
      },
    },
  },
  plugins: [],
};

export default config;
