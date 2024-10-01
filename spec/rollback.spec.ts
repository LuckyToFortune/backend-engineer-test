import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import Fastify from 'fastify';
import { rollbackRoutes } from '../src/routes/rollback.routes';
import pool from '../src/db/pool';

describe('Rollback Functionality', () => {
  const app = Fastify();
  app.register(rollbackRoutes);

  beforeAll(async () => {
    await app.ready();  // Ensure Fastify is ready

    const client = await pool.connect();
    try {
      // Clean up existing data (optional)
      await client.query('DELETE FROM blocks');
      await client.query('DELETE FROM transactions');
      await client.query('DELETE FROM outputs');
      await client.query('DELETE FROM addresses');

      // Insert data for the test case
      await client.query('INSERT INTO addresses (address, balance) VALUES ($1, $2)', ['addr1', 10]);
      await client.query('INSERT INTO blocks (id, height) VALUES ($1, $2)', ['block1', 1]);
      await client.query('INSERT INTO transactions (id, block_id) VALUES ($1, $2)', ['tx1', 'block1']);
      await client.query('INSERT INTO outputs (transaction_id, address, value) VALUES ($1, $2, $3)', ['tx1', 'addr1', 10]);
      await client.query('INSERT INTO blocks (id, height) VALUES ($1, $2)', ['block2', 2]);
      await client.query('INSERT INTO transactions (id, block_id) VALUES ($1, $2)', ['tx2', 'block2']);
      await client.query('INSERT INTO outputs (transaction_id, address, value) VALUES ($1, $2, $3)', ['tx2', 'addr1', 5]);
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    await app.close();  
    await pool.end();
  });

  it('should rollback to a specific block height', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/rollback',
      query: {
        height: '1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Successfully rolled back to height 1',
    });

    // Verify that blocks above height 1 are deleted
    const client = await pool.connect();
    try {
      const blockCheck = await client.query('SELECT * FROM blocks WHERE height > $1', [1]);
      expect(blockCheck.rowCount).toBe(0);

      // Verify that the balance for 'addr1' has reverted
      const balanceCheck = await client.query('SELECT balance FROM addresses WHERE address = $1', ['addr1']);
      expect(balanceCheck.rows[0].balance).toBe(10); 
    } finally {
      client.release();
    }
  }, 20000);  
});
