import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 加载 .env 环境变量
dotenv.config();

// 创建数据库连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true, // 连接池满时等待
    connectionLimit: 1000,      // 最大并发连接数
    queueLimit: 0             // 排队请求数量无限制
});

// 测试连接是否成功的辅助函数 (可选，通常在项目启动时调用)
export async function checkConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库 YisuHotel 连接成功！');
        connection.release(); // 释放连接回池子
    } catch (error) {
        console.error('数据库连接失败:', error);
    }
}

export default pool;