import type { FastifyReply, FastifyRequest } from "fastify";
import { getBalance } from "../services/balance.services";

export const getBalanceController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { address } = req.params as { address: string };
    const balance = await getBalance(address);
    reply.status(200).send({address, balance});
  } catch (error: any) {
    reply.status(400).send({error: error.message})
  }
}