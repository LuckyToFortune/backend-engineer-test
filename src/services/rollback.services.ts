import pool from '../db/pool';

export const rollbackToHeight = async (height: number) => {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Delete transactions and outputs that are associated with blocks above the given height
    await client.query(`
      DELETE FROM outputs 
      WHERE transaction_id IN (
        SELECT id FROM transactions WHERE block_id IN (
          SELECT id FROM blocks WHERE height > $1
        )
      )
    `, [height]);

    await client.query(`
      DELETE FROM transactions WHERE block_id IN (
        SELECT id FROM blocks WHERE height > $1
      )
    `, [height]);

    // Delete the blocks above the given height
    await client.query('DELETE FROM blocks WHERE height > $1', [height]);

    // Recalculate balances by summing up the remaining outputs
    const res = await client.query(`
      SELECT address, SUM(value) as balance
      FROM outputs
      GROUP BY address
    `);

    // Reset all balances
    await client.query('UPDATE addresses SET balance = 0');

    // Update the balances in the addresses table
    for (const row of res.rows) {
      await client.query('UPDATE addresses SET balance = $1 WHERE address = $2', [row.balance, row.address]);
    }

    // Commit transaction
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
