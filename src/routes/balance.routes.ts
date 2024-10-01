import type { FastifyInstance } from "fastify";
import { getBalanceController } from "../controllers/balance.controller";

export const balanceRoutes = async (app: FastifyInstance) => {
  app.get("/balance/:address", getBalanceController)
}