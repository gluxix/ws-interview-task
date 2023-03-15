const assert = require('assert');

const Server = require('../../src/server');
const Client = require('../../src/client');

const PORT = 8080;
const ADDR = `ws://127.0.0.1:${PORT}`;

describe('Integration tests', () => {
  let server;

  beforeEach(() => {
    server = new Server({
      heartbeatInterval: 1000,
      subscribeDelay: 5,
      unsubscribeDelay: 10,
    });
    server.listen(PORT);
  });

  afterEach(() => {
    server.gracefulShutdown();
  });

  describe('#Subscribed', () => {
    it('should be idempotent', async () => {
      const client = new Client(ADDR);
      await client.connectAsync();

      const firstDate = await subscribeAndWait(client);
      const secondDate = await subscribeAndWait(client);
      const thirdDate = await subscribeAndWait(client);
      await unsubscribeAndWait(client);
      const fourthDate = await subscribeAndWait(client);

      assert(firstDate === secondDate);
      assert(secondDate === thirdDate);
      assert(thirdDate < fourthDate);
    });
  });

  describe('#Unsubscribed', () => {
    it('should be idempotent', async () => {
      const client = new Client(ADDR);
      await client.connectAsync();

      const firstDate = await unsubscribeAndWait(client);
      const secondDate = await unsubscribeAndWait(client);
      const thirdDate = await unsubscribeAndWait(client);
      await subscribeAndWait(client);
      const fourthDate = await unsubscribeAndWait(client);

      assert(firstDate === secondDate);
      assert(secondDate === thirdDate);
      assert(thirdDate < fourthDate);
    });
  });

  describe('#Count', () => {
    it('should count correctly', async () => {
      const firstClient = new Client(ADDR);
      const secondClient = new Client(ADDR);
      await Promise.all([
        firstClient.connectAsync(),
        secondClient.connectAsync(),
      ]);

      let count = await countAndWait(firstClient);

      assert(count === 0);

      await subscribeAndWait(firstClient);
      await subscribeAndWait(firstClient);
      count = await countAndWait(firstClient);

      assert(count === 1);

      await subscribeAndWait(secondClient);
      count = await countAndWait(secondClient);

      assert(count === 2);

      await unsubscribeAndWait(secondClient);
      count = await countAndWait(secondClient);

      assert(count === 1);
    });
  });

  describe('Bad payload', () => {
    it('should return error', async () => {
      const client = new Client(ADDR);
      await client.connectAsync();

      const payload = await sendBadPayloadAndWait(client);

      assert(payload.type === 'Error');
      assert(payload.error === 'Bad formatted payload, non JSON');
      assert(payload.updatedAt > 0);
    });
  });

  describe('Invalid command', () => {
    it('should return error', async () => {
      const client = new Client(ADDR);
      await client.connectAsync();

      const payload = await sendInvalidCommandAndWait(client);

      assert(payload.type === 'Error');
      assert(payload.error === 'Requested method not implemented');
      assert(payload.updatedAt > 0);
    });
  });
});

function subscribeAndWait(client) {
  client.subscribe();
  return new Promise((resolve) => {
    client.on('subscribed', (updatedAt) => {
      resolve(updatedAt);
    });
  });
}

function unsubscribeAndWait(client) {
  client.unsubscribe();
  return new Promise((resolve) => {
    client.on('unsubscribed', (updatedAt) => {
      resolve(updatedAt);
    });
  });
}

function countAndWait(client) {
  client.subscribersCount();
  return new Promise((resolve) => {
    client.on('count', (count) => {
      resolve(count);
    });
  });
}

function sendBadPayloadAndWait(client) {
  client.send('Non JSON');
  return new Promise((resolve) => {
    client.on('protocolError', (payload) => {
      resolve(payload);
    });
  });
}

function sendInvalidCommandAndWait(client) {
  client.send({
    type: 'Unknown',
  });
  return new Promise((resolve) => {
    client.on('protocolError', (payload) => {
      resolve(payload);
    });
  });
}
