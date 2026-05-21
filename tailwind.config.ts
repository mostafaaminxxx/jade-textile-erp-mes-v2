import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jade: {
          orange: "#f97316",
          blue: "#0f6fb8",
          ink: "#152033",
          steel: "#5b677a",
          line: "#d7dde7",
          panel: "#f7f9fc",
        },
      },
      boxShadow: {
        control: "0 18px 50px rgba(21, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
