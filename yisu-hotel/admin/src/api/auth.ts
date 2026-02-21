import request from '../utils/request'

// 登录接口
export const loginApi = (data: Record<string, unknown>) => {
  return request.post('/auth/login', data)
}

// 注册接口
export const registerApi = (data: Record<string, unknown>) => {
  return request.post('/auth/register', data)
}
