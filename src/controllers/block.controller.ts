import type { FastifyReply, FastifyRequest } from "fastify";
import type { Block } from "../types/types";
import { handleBlock } from "../services/block.services";

export const postBlockController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const block = req.body as Block;
    await handleBlock(block)
    reply.status(200).send({message: "Block processed successfully"});
  } catch (error: any) {
    reply.status(400).send({error: error.message})
  }
}