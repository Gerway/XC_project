import React, { useState } from 'react'
import { Form, Input, Button, Radio, Checkbox, ConfigProvider, App } from 'antd'
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyOutlined,
  MobileOutlined,
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Register.module.scss'
import type { RadioChangeEvent } from 'antd'
import { registerApi } from '../../api/auth'

// 用户角色枚举
enum UserRole {
  MERCHANT = 'merchant',
  ADMIN = 'admin',
}

// 注册表单数据接口
interface RegisterFormValues {
  username: string
  email: string
  phone: string
  password?: string
  confirmPassword?: string
  agreement: boolean
}

const Register: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.MERCHANT)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { message } = App.useApp()

  // 模拟密码强度计算状态
  const [passwordStrength, setPasswordStrength] = useState<number>(0)

  // 计算密码强度
  const calculateStrength = (password: string) => {
    let score = 0
    if (password.length > 6) score += 1
    if (password.length > 10) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    setPasswordStrength(score)
  }

  // 角色切换处理
  const onRoleChange = (e: RadioChangeEvent) => {
    setRole(e.target.value)
  }

  // 注册提交处理
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      message.loading({ content: '注册中...', key: 'register' })
      const res = (await registerApi({
        username: values.username,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: role === UserRole.MERCHANT ? '商户' : '管理',
      })) as unknown as { message: string; user: Record<string, unknown> }
      message.success({ content: res.message || '注册并登录成功！', key: 'register', duration: 2 })
      // 服务器会自动 set cookie，另外也可以保存用户信息
      localStorage.setItem('user', JSON.stringify(res.user))

      // 可以直接跳转了，或者让用户重新手动登录
      if (role === UserRole.ADMIN) {
        navigate('/admin/audit')
      } else {
        navigate('/rooms')
      }
    } catch (error: unknown) {
      console.error('注册错误:', error)
      const err = error as { message?: string }
      message.error({ content: err.message || '注册失败！', key: 'register', duration: 2 })
    }
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#135bec',
          borderRadius: 4,
          fontFamily: 'Inter, sans-serif',
        },
      }}
    >
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.brand}>
            <div className={styles.logo}>Y</div>
            <span>易宿酒店</span>
          </div>
          <div className={styles.content}>
            <h1>
              赋能您的
              <br />
              酒店业务
            </h1>
            <p>加入成千上万的酒店经营者，使用易宿企业级平台高效管理您的酒店资产。</p>
            <div className={styles.testimonial}>
              <div className={styles.avatars}>
                {/* 头像占位符 */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="avatar" />
              </div>
              <span>2,000+ 家酒店信赖我们。</span>
            </div>
          </div>
          <div className={styles.copyright}>
            © 2026 易宿酒店集团 &nbsp;&nbsp;&nbsp; 隐私政策 &nbsp; 服务条款
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.formWrapper}>
            <h2 className={styles.title}>创建账号</h2>
            <p className={styles.subtitle}>立即开始管理您的酒店资产。</p>
            <div className={styles.roleSwitcher}>
              <Radio.Group
                value={role}
                onChange={onRoleChange}
                buttonStyle="solid"
                block
                size="large"
              >
                <Radio.Button value={UserRole.MERCHANT}>商家</Radio.Button>
                <Radio.Button value={UserRole.ADMIN}>管理员</Radio.Button>
              </Radio.Group>
            </div>
            <Form
              form={form}
              name="register"
              onFinish={handleRegister}
              layout="vertical"
              size="large"
              requiredMark={false}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="manager@example.com" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                ]}
              >
                <Input prefix={<MobileOutlined />} placeholder="请输入手机号" />
              </Form.Item>

              <Form.Item label="密码" style={{ marginBottom: 0 }}>
                <div className={styles.passwordGroup}>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                    className={styles.passwordField}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="********"
                      onChange={(e) => calculateStrength(e.target.value)}
                    />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        },
                      }),
                    ]}
                    className={styles.passwordField}
                  >
                    <Input.Password prefix={<SafetyOutlined />} placeholder="********" />
                  </Form.Item>
                </div>
              </Form.Item>

              <div className={styles.strengthSection}>
                <div className={styles.strengthText}>
                  {passwordStrength > 2 ? '良好' : passwordStrength > 1 ? '中等' : '弱'}
                </div>
                <div className={styles.strengthBar}>
                  <div
                    className={
                      passwordStrength > 0
                        ? passwordStrength > 2
                          ? styles.active
                          : passwordStrength > 1
                            ? styles.medium
                            : styles.weak
                        : ''
                    }
                  ></div>
                  <div
                    className={
                      passwordStrength > 1
                        ? passwordStrength > 2
                          ? styles.active
                          : styles.medium
                        : ''
                    }
                  ></div>
                  <div className={passwordStrength > 2 ? styles.active : ''}></div>
                  <div className={passwordStrength > 3 ? styles.active : ''}></div>
                </div>
                <div className={styles.strengthHint}>至少包含8个字符，并包含符号。</div>
              </div>

              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value ? Promise.resolve() : Promise.reject(new Error('请同意服务条款')),
                  },
                ]}
              >
                <Checkbox>
                  我同意 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a>。
                </Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  className={styles.submitButton}
                >
                  创建账号
                </Button>
              </Form.Item>
            </Form>
            <div className={styles.footer}>
              已有账号？
              <Link to="/login">去登录</Link>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default Register
