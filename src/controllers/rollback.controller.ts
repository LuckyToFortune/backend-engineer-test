import type { FastifyReply, FastifyRequest } from "fastify";
import { rollbackToHeight } from "../services/rollback.services";

export const rollbackController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { height } = req.query as { height: number };
    await rollbackToHeight(height);
    reply.status(200).send({ message: `Successfully rolled back to height ${height}` });
  } catch (error: any) {
    reply.status(400).send({error: error.message})
  }
}