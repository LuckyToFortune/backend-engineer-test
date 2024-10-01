import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      address VARCHAR(64) PRIMARY KEY, 
      balance NUMERIC DEFAULT 0      
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id VARCHAR(64) PRIMARY KEY,     
      height INT UNIQUE NOT NULL,      
      created_at TIMESTAMP DEFAULT NOW() 
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(64) PRIMARY KEY,      
      block_id VARCHAR(64) REFERENCES blocks(id) ON DELETE CASCADE, 
      created_at TIMESTAMP DEFAULT NOW() 
    );

    CREATE TABLE IF NOT EXISTS inputs (
      id SERIAL PRIMARY KEY,           
      transaction_id VARCHAR(64) REFERENCES transactions(id) ON DELETE CASCADE, 
      input_tx_id VARCHAR(64) REFERENCES transactions(id), 
      input_index INT,                 
      address VARCHAR(64) REFERENCES addresses(address), 
      value NUMERIC                   
    );

    CREATE TABLE IF NOT EXISTS outputs (
      id SERIAL PRIMARY KEY,           
      transaction_id VARCHAR(64) REFERENCES transactions(id) ON DELETE CASCADE, 
      output_index INT,
      address VARCHAR(64) REFERENCES addresses(address), 
      value NUMERIC                    
    );
  `);
};

export default pool;
