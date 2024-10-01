import type { FastifyInstance } from "fastify";
import { postBlockController } from "../controllers/block.controller";

export const blockRoutes = async (app: FastifyInstance) => {
    app.post("/blocks", postBlockController)
}