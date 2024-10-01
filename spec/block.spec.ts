import  Fastify  from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { blockRoutes } from '../src/routes/block.routes';
import pool from '../src/db/pool';

describe("Block Handling", () => {
    const app = Fastify();

    beforeAll(async () => {
        app.register(blockRoutes);
        await app.ready();
        console.log("Fastify server is ready");

        await pool.connect();
        console.log("Database connection is ready")
    })

    afterAll(async () => {
        await app.close();
        await pool.end()
    })

    // Test 1: Check if the server can handle a valid block
    it('should handle a valid block and generate block ID automatically', async () => {
        const block = {
            height: 1,
            transaction: [
                {
                    id: 'tx1',
                    inputs: [],
                    outputs: [
                        {
                            address: "addr1",
                            value: 10
                        }
                    ]
                }
            ]
        };

        console.log("Starting test: should handle a valid block");

        const response = await app.inject({
            method: "POST",
            url: "/blocks",
            payload: block
        });

        console.log("Received response from Fastify");

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({ message: 'Block processed successfully' });

        // Verify that the balance has been updated in the database
        const res = await pool.query('SELECT balance FROM addresses WHERE address = $1', ['addr1']);
        expect(res.rows[0].balance).toBe(10);
    });

    // Test 2: Check for invalid block height
    it("should throw an error for invalid block height", async () => {
        const block = {
            height: 3, // Assuming the current block height is 1, this is invalid
            transactions: []
        };

        const response = await app.inject({
            method: "POST",
            url: "/blocks",
            payload: block
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe('Invalid block height. Expected 2 but received 3');
    });

    // Test 3: Check for mismatched input/output values in a transaction
    it('should throw an error for mismatched input and output values in a transaction', async () => {
        const block = {
          height: 2,
          transactions: [
            {
              id: "tx2",
              inputs: [],
              outputs: [
                { address: "addr2", value: 15 }
              ]
            }
          ]
        };
    
        const response = await app.inject({
          method: 'POST',
          url: '/blocks',
          payload: block
        });
    
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe('Invalid transaction: Input sum (0) does not match output sum (15)');
    }, 2000);

     // Test 4: Verify the database connection
     it('should connect to the database', async () => {
        const res = await pool.query('SELECT 1');
        expect(res.rows[0]).toEqual({ '?column?': 1 });
    });

    // Test 5: Simple health check for Fastify
    app.get('/health', async (req, reply) => {
        return { status: 'ok' };
    });

    it('should return server health status', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health'
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({ status: 'ok' });
    });
})