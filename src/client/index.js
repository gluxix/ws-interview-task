const WebSocket = require('ws');
const { EventEmitter } = require('events');

const { Commands } = require('../constants');

class SubscriptionClient extends EventEmitter {
  #serverAddress;
  #silenceHaertbeat;
  #ws;

  constructor(serverAddress, silenceHaertbeat = true) {
    super();
    this.#serverAddress = serverAddress;
    this.#silenceHaertbeat = silenceHaertbeat;
    this.#ws = null;
  }

  connect() {
    if (this.#ws !== null) {
      console.warn('Connection is already established');
      return;
    }

    this.#ws = new WebSocket(this.#serverAddress);
    this.#ws
      .on('open', () => {
        this.emit('open');
      })
      .on('message', (data) => {
        this.#handleMessage(data);
      })
      .on('close', (code, reason) => {
        this.emit('close', code, reason);
      })
      .on('error', (err) => {
        this.emit('error', err);
      });
  }

  subscribe() {
    this.#checkConnection();

    this.#ws.send(JSON.stringify({
      type: Commands.Subscribe,
    }));
  }

  unsubscribe() {
    this.#checkConnection();

    this.#ws.send(JSON.stringify({
      type: Commands.Unsubscribe,
    }));
  }

  subscribersCount() {
    this.#checkConnection();

    this.#ws.send(JSON.stringify({
      type: Commands.CountSubscribers,
    }));
  }

  #handleMessage(data) {
    try {
      const payload = JSON.parse(data);
      let isHeartbeat = false;
      switch (payload.type) {
        case Commands.Heartbeat: {
          isHeartbeat = true;
          this.#heartbeat();
          break;
        }
        case Commands.Subscribe: {
          this.emit('subscribed', payload.updatedAt);
          break;
        }
        case Commands.Unsubscribe: {
          this.emit('unsubscribed', payload.updatedAt);
          break;
        }
        case Commands.CountSubscribers: {
          this.emit('count', payload.count, payload.updatedAt);
          break;
        }
      }

      if (isHeartbeat && this.#silenceHaertbeat) {
        return;
      }
      console.log(`${Date.now()}: ${data.toString('utf-8')}`);
    } catch (err) {
      console.error(err);
      console.log(`${Date.now()}: ${data.toString('utf-8')}`);
    }
  }

  #checkConnection() {
    if (this.#ws === null) {
      throw new Error('Client is not connected to the server');
    }
  }

  #heartbeat() {
    this.#ws.send(JSON.stringify({
      type: Commands.Heartbeat,
      updatedAt: Date.now(),
    }))
  }
}

module.exports = SubscriptionClient;