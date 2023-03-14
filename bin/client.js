const readline = require('readline');

const Client = require('../src/client');

const SILENCE_HEARTBEAT = process.env.SILENCE_HB === 'true';
const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'ws://127.0.0.1:8080';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '',
});

const client = new Client(SERVER_ADDRESS, SILENCE_HEARTBEAT);

client.connect();
client
  .on('open', () => {
    console.log('Client has been connected to the server');
  })
  .on('subscribed', (date) => {
    console.log('Client subscribed at:', date);
  })
  .on('unsubscribed', (date) => {
    console.log('Client unsubscribed at:', date);
  })
  .on('count', (count) => {
    console.log('Subscribers amount:', count);
  })
  .on('close', (code, reason) => {
    console.log('Connection was closed with code: %d. Reason: %s', code, reason || '-');
    process.exit(0);
  })
  .on('error', (err) => {
    console.error(err);
    process.exit(1);
  });

rl.on('line', (line) => {
  for (const c of line.trim().toLowerCase()) {
    switch (c) {
      case 's':
        client.subscribe();
        break;
      case 'u':
        client.unsubscribe();
        break;
      case 'c':
        client.subscribersCount();
        break;
    }
  }
}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
