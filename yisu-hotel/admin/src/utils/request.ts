import axios from 'axios'

const request = axios.create({
  baseURL: 'https://yisuhotel.onrender.com/api',
  timeout: 10000,
  withCredentials: true, // 跨域请求时是否需要使用凭证
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 中读取 token，附加到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data // 直接返回 data 字段
  },
  (error) => {
    // 统一处理错误
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
  },
)

export default request
