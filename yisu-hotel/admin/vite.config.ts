import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 仅在执行 build 时生效，dev 模式不影响
    visualizer({
      open: true, // build 完成后自动在浏览器打开分析报告
      gzipSize: true, // 同时显示 gzip 压缩后的大小
      brotliSize: true, // 同时显示 brotli 压缩后的大小
      filename: 'dist/stats.html', // 报告输出路径
    }),
  ],
  resolve: {
    alias: {
      '@yisu/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8800',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 手动拆包：把大型第三方库分离，避免首屏加载全部内容
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-dayjs': ['dayjs'],
        },
      },
    },
  },
})
