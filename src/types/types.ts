export type Output = {
  address: string;
  value: number;
};

export type Input = {
  txId: string;
  index: number;
};

export type Transaction = {
  id: string;
  inputs: Array<Input>;
  outputs: Array<Output>;
};

export type Block = {
  id: string;
  height: number;
  transactions: Array<Transaction>;
};
