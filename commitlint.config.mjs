export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'chore',
      ],
    ],
    'subject-case': [0], // Disable subject case check to allow Chinese
  },
};
