import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { balanceRoutes } from '../src/routes/balance.routes';
import pool from '../src/db/pool';


describe("Balance Retrieval", () => {
  const app = Fastify();

  app.register(balanceRoutes);

  beforeAll(async () => {
    await app.ready(); 
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM addresses');

      await client.query('INSERT INTO addresses (address, balance) VALUES ($1, $2)', ['addr1', 10]);
    } finally {
      client.release(); 
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    await app.close(); 
    await pool.end();  
  });

  // Test case 1: Retrieve balance for an existing address
  it('should retrieve the balance for an existing address', async () => {
    const response = await app.inject({
      method: "GET",
      url: "/balance/addr1"
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      address: 'addr1',
      balance: 10
    });
  }, 20000); 

  // Test case 2: Return an error for a non-existing address
  it('should return an error for a non-existing address', async () => {
    const response = await app.inject({
      method: "GET",
      url: "/balance/non_existing_address"
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      error: "Address non_existing_address not found"
    });
  }, 20000);  
});