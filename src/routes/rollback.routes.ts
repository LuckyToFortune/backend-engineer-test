import type { FastifyInstance } from "fastify";
import { rollbackController } from "../controllers/rollback.controller";

export const rollbackRoutes = async (app: FastifyInstance) => {
  app.post("/rollback", rollbackController);
}