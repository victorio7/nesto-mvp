import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#f6f1e7",
        line: "#ded2bd",
        pine: "#174f3f",
        coral: "#ef6f61",
        sun: "#c9974a",
        wood: "#8a623f"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
