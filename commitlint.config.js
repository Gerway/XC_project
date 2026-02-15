export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 允许中文提交
    'subject-case': [0],
  },
}
