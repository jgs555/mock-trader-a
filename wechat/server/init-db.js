const mysql = require('mysql2/promise');
const dbConfig = require('./config/db.config.js');

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(64) NOT NULL UNIQUE,
  nickname VARCHAR(64),
  avatar_url VARCHAR(255),
  total_assets DECIMAL(15, 2) DEFAULT 1000000.00,
  win_count INT DEFAULT 0,
  lose_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const createBattleRecordsTable = `
CREATE TABLE IF NOT EXISTS battle_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(64),
  player1_id BIGINT,
  player2_id BIGINT,
  stock_code VARCHAR(10),
  start_date DATE,
  winner_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

async function init() {
  let connection;
  try {
    // 1. 先连接到 MySQL 服务器 (不指定具体数据库)，避免因数据库不存在而报错
    connection = await mysql.createConnection({
      host: dbConfig.HOST,
      user: dbConfig.USER,
      password: dbConfig.PASSWORD,
      port: dbConfig.PORT
    });
    console.log('✅ Connected to MySQL server successfully.');

    // 2. 尝试创建数据库 (如果不存在)
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.DB}\``);
      console.log(`✅ Database '${dbConfig.DB}' checked/created.`);
    } catch (err) {
      if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
        console.log(`⚠️  Could not create database (Access Denied). Assuming it exists and trying to use it...`);
      } else {
        throw err;
      }
    }

    // 3. 切换到该数据库
    await connection.query(`USE \`${dbConfig.DB}\``);
    console.log(`✅ Switched to database '${dbConfig.DB}'.`);

    // 4. 创建表
    await connection.query(createUsersTable);
    console.log('✅ Users table checked/created.');

    await connection.query(createBattleRecordsTable);
    console.log('✅ Battle records table checked/created.');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    if (error.code === 'ER_DBACCESS_DENIED_ERROR') {
      console.error('👉 Suggestion: Check if the user has permissions to create/access the database.');
    }
    process.exit(1);
  }
}

init();