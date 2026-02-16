export default {
  'yisu-hotel/mobile/**/*.{js,jsx,ts,tsx}': [
    'prettier --write',
    'pnpm --filter mobile exec eslint --fix',
  ],
  'yisu-hotel/admin/**/*.{ts,tsx}': ['prettier --write', 'pnpm --filter admin exec eslint --fix'],
  'server/**/*.{ts,js}': ['prettier --write', 'pnpm --filter server exec eslint --fix'],
}
