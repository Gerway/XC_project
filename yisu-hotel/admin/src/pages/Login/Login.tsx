import React, { useState } from 'react'
import { Form, Input, Button, Radio, Checkbox, message, ConfigProvider } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Login.module.scss'
import { UserRole } from '@yisu/shared/enums/UserRole'
import type { RadioChangeEvent } from 'antd'

interface LoginFormValues {
  username: string
  password?: string
  remember?: boolean
}

const Login: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.MERCHANT)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onRoleChange = (e: RadioChangeEvent) => {
    setRole(e.target.value)
    message.info(`已切换至 ${e.target.value === UserRole.MERCHANT ? '商家' : '管理员'} 登录`)
  }

  const handleLogin = async (values: LoginFormValues) => {
    console.log('Login attempt:', { role, ...values })
    message.loading('登录中...', 1.5).then(() => {
      message.success('登录成功！(演示)')
      // 根据角色跳转到不同入口
      if (role === UserRole.ADMIN) {
        navigate('/admin/audit')
      } else {
        navigate('/rooms')
      }
    })
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
        {/* Left Panel - Hidden on mobile */}
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

        {/* Right Panel - Login Form */}
        <div className={styles.rightPanel}>
          <div className={styles.mobileHeader}>
            <div className={styles.logo}>Y</div>
            <span>易宿酒店</span>
          </div>

          <div className={styles.formWrapper}>
            <h2 className={styles.title}>账号登录</h2>
            <p className={styles.subtitle}>欢迎回来！请输入您的账号信息以继续。</p>
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
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
              initialValues={{ remember: true }}
              requiredMark={false}
            >
              <Form.Item
                name="username"
                label="账号"
                rules={[{ required: true, message: '请输入账号' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="邮箱 / 手机号 / 用户名"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              <div className={styles.optionsRow}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <a href="#">忘记密码？</a>
              </div>

              <Form.Item>
                <Button type="primary" htmlType="submit" block className={styles.submitButton}>
                  登录
                </Button>
              </Form.Item>
            </Form>
            <div className={styles.divider}>
              <span>其他选项</span>
            </div>
            <div className={styles.signupLink}>
              还没有账号？<Link to="/register">立即注册</Link>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default Login
