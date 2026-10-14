const config = {
  "*.{js,jsx,mjs,cjs,ts,tsx}": ["eslint --fix --no-warn-ignored", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"],
};

export default config;
