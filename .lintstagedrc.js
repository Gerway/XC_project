export default {
  'yisu-hotel/mobile/**/*.{js,jsx,ts,tsx}': [
    'prettier --write',
    'cd yisu-hotel/mobile && npx eslint --fix',
  ],
  'yisu-hotel/admin/**/*.{ts,tsx}': [
    'prettier --write',
    'cd yisu-hotel/admin && npx eslint --fix',
  ],
  'server/**/*.{ts,js}': [
    'prettier --write',
    'cd server && npx eslint --fix',
  ],
}
