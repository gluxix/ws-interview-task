const SubscribeServer = require('../src/server');

process.on('unhandledRejection', (error) => {
  throw error;
 });
  
process.on('uncaughtException', (error) => {
  console.error(error);
  process.exit(1);
});

const PORT = parseInt(process.env.PORT) || 8080;
const HEARTBEAT_INTERVAL_IN_MS = parseInt(process.env.HB_INT) || 1000;

const server = new SubscribeServer({
  heartbeatInterval: HEARTBEAT_INTERVAL_IN_MS,
});

server.listen(PORT)
  .once('listening', () => {
    console.log(`WS server is listening on port ${PORT}`);
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .once('close', () => {
    console.log('Server has been closed');
  });

process.on('SIGINT', () => {
  console.info('\nGraceful shutdown...');
  server.gracefulShutdown();
});
