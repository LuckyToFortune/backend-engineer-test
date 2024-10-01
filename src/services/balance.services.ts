import pool from "../db/pool"

export const getBalance = async (address: string): Promise<number> => {
  const client = await pool.connect();

  try {
    const res = await client.query('SELECT balance FROM addresses WHERE address = $1', [address]);

    if (res.rowCount === 0) {
      throw new Error(`Addres ${address} not found`)
    }

    return res.rows[0].balance;

  } catch (error) {
    throw error;
  } finally {
    client.release()
  }
}