import pool from "../db/pool";
import type { Block, Input, Output, Transaction } from "../types/types";
import crypto from "crypto"

export const handleBlock = async (block: Block) => {
  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query("BEGIN");

    // Validate block height using COALESCE to handle null values
    const res = await client.query(`SELECT COALESCE(MAX(height), 0) AS "maxHeight" FROM blocks`);

    console.log('Query Result: ', res.rows);

    const currentHeight = res.rows[0].maxHeight;

    console.log(`Current block height in database: ${currentHeight}`);

    if (typeof currentHeight !== 'number' || isNaN(currentHeight)) {
      throw new Error("Error determining the current block height.");
    }

    if (block.height !== currentHeight + 1) {
      throw new Error(`Invalid block height. Expected ${currentHeight + 1} but received ${block.height}`);
    }

    // Validate transactions: sum(inputs) === sum(outputs)
    // for (const tx of block.transactions) {s
    //   const inputSum = await sumInputs(tx.inputs, client);
    //   const outputSum = sumOutputs(tx.outputs);

    //   if (inputSum !== outputSum) {
    //     throw new Error(`Invalid transaction: Input sum (${inputSum}) does not match output sum (${outputSum})`);
    //   }
    // }

    // Validate block ID (SHA256 hash)
    const concatenatedIds = block.height + block.transactions.map(tx => tx.id).join('');
    const blockId = crypto.createHash('sha256').update(concatenatedIds).digest('hex');

    // Insert block into database
    await client.query('INSERT INTO blocks (id, height) VALUES ($1, $2)', [blockId, block.height]);

    // Process transactions and update balances
    for (const tx of block.transactions) {
      await processTransaction(tx, blockId, client)
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release()
  }
}

// Helper functions
const sumInputs = async (inputs: Input[], client: any) => {
  let sum = 0;
  for (const input of inputs) {
    const res = await client.query('SELECT value FROM outputs WHERE transaction_id = $1 AND id = $2', [input.txId, input.index]);
    sum += res.rows[0].value;
  }

  return sum;
}

const sumOutputs = (outputs: Output[]) => {
  return outputs.reduce((sum, output) => sum + output.value, 0)
}

const processTransaction = async (transaction: Transaction, blockId: string, client: any) => {
  // Insert the transaction into the transactions table
  await client.query('INSERT INTO transactions (id, block_id) VALUES ($1, $2)', [transaction.id, blockId]);

  // Handle inputs: spend previous outputs (reduce balances)
  for (const input of transaction.inputs) {
    // Look up the output being spent by this input using input_index and output_index
    const outputResult = await client.query(
      'SELECT address, value FROM outputs WHERE transaction_id = $1 AND output_index = $2',
      [input.txId, input.index] // Match the txId and index to the correct output
    );

    if (outputResult.rows.length === 0) {
      throw new Error(`Output not found for transaction ${input.txId} at index ${input.index}`);
    }

    const { address, value } = outputResult.rows[0];

    // Deduct the value from the balance of the sender's address
    await client.query('UPDATE addresses SET balance = balance - $1 WHERE address = $2', [value, address]);
  }

  // Handle outputs: create new outputs and increase balances
  let outputIndex = 0;  // Track the index of each output within the transaction
  for (const output of transaction.outputs) {
    // Check if the receiving address exists, if not, insert it with a default balance of 0
    const addressCheck = await client.query('SELECT address FROM addresses WHERE address = $1', [output.address]);

    if (addressCheck.rowCount === 0) {
      // Insert the new address into the addresses table with an initial balance of 0
      await client.query('INSERT INTO addresses (address, balance) VALUES ($1, 0)', [output.address]);
    }

    // Insert the new output into the outputs table, with its corresponding output_index
    await client.query(
      'INSERT INTO outputs (transaction_id, address, value, output_index) VALUES ($1, $2, $3, $4)',
      [transaction.id, output.address, output.value, outputIndex]
    );

    // Add the output value to the balance of the receiving address
    await client.query('UPDATE addresses SET balance = balance + $1 WHERE address = $2', [output.value, output.address]);

    // Increment the output index for the next output
    outputIndex++;
  }
};
