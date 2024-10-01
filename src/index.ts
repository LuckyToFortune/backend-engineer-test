import Fastify from 'fastify';
import { createTables } from './db/pool';
import { blockRoutes } from './routes/block.routes';
import { balanceRoutes } from './routes/balance.routes';
import { rollbackRoutes } from './routes/rollback.routes';

const app = Fastify({
  logger: true,
});

app.get("/", async(request, reply) => {
  return { hello: "world" }
})

app.register(blockRoutes);
app.register(balanceRoutes);
app.register(rollbackRoutes);

// Start the server and create tables
const startServer = async () => {
  try {
    await createTables();
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on port 3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();

