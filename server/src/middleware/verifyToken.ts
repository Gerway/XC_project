import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展 Express 的 Request 类型
// 因为原生的 req 对象里没有 userId 和 role，为了让 TypeScript 不对req.userId报错，我们必须声明扩充它
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            role?: string;
        }
    }
}


export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    // 先尝试从请求头中获取 Authorization: Bearer xxx
    // 如果没有，再尝试从 Cookie 中获取 (为了兼容网页端)
    const authHeader = req.headers.authorization;
    let token = req.cookies.token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        // 格式为 'Bearer <token>'，提取后面的 token 部分
        token = authHeader.substring(7);
    }

    // 如果连 token 都没有，直接拦截，返回 401 (未授权)
    if (!token) {
        res.status(401).json({ message: "未登录，请先登录！" });
        return;
    }

    try {
        // 使用秘钥验证 token 是否合法、是否过期
        jwt.verify(token, process.env.JWT_SECRET as string, (err: any, payload: any) => {
            if (err) {
                // 如果 token 被篡改，或者已经过期了，返回 403 (禁止访问)
                res.status(403).json({ message: "登录凭证已失效或不合法，请重新登录！" });
                return;
            }

            // 校验成功，把解密出来的 payload（里面有 id 和 role）挂载到 req 上
            req.userId = payload.id;
            req.role = payload.role;

            // 放行，调用 next()，请求就会进入你真正的业务 Controller
            next();
        });
    } catch (error) {
        console.error("Token校验中间件报错:", error);
        res.status(500).json({ message: "服务器内部错误！" });
    }
};