import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}", // 👈 ده اللي هيصلح الألوان في الهيدر والبوكسات
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        zain: ['Zain', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;