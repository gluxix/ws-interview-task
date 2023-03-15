const WebSocket = require('ws');
const { EventEmitter } = require('events');

const { Commands } = require('../constants');

const Events = {
  Open: 'open',
  Close: 'close',
  Error: 'error',
  Subscribed: 'subscribed',
  Unubscribed: 'unsubscribed',
  Count: 'count',
  ProtocolError: 'protocolError',
}

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
        this.emit(Events.Open);
      })
      .on('message', (data) => {
        this.#handleMessage(data);
      })
      .on('close', (code, reason) => {
        this.emit(Events.Close, code, reason);
      })
      .on('error', (err) => {
        this.emit(Events.Error, err);
      });
  }

  connectAsync() {
    return new Promise((resolve, reject) => {
      if (this.#ws !== null) {
        console.warn('Connection is already established');
        return resolve();
      }
  
      this.#ws = new WebSocket(this.#serverAddress);
      this.#ws
        .on('open', () => {
          this.emit(Events.Open);
          resolve();
        })
        .on('message', (data) => {
          this.#handleMessage(data);
        })
        .on('close', (code, reason) => {
          this.emit(Events.Close, code, reason);
        })
        .on('error', (err) => {
          this.emit(Events.Error, err);
          reject(err);
        });
    })
  }

  subscribe() {
    this.send({
      type: Commands.Subscribe,
    });
  }

  unsubscribe() {
    this.send({
      type: Commands.Unsubscribe,
    });
  }

  subscribersCount() {
    this.send({
      type: Commands.CountSubscribers,
    });
  }

  send(data) {
    if (this.#ws === null) {
      throw new Error('Client is not connected to the server');
    }

    this.#ws.send(JSON.stringify(data));
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
          this.emit(Events.Subscribed, payload.updatedAt);
          break;
        }
        case Commands.Unsubscribe: {
          this.emit(Events.Unubscribed, payload.updatedAt);
          break;
        }
        case Commands.CountSubscribers: {
          this.emit(Events.Count, payload.count, payload.updatedAt);
          break;
        }
        default:
          this.emit(Events.ProtocolError, payload);
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

  #heartbeat() {
    this.send({
      type: Commands.Heartbeat,
      updatedAt: Date.now(),
    });
  }
}

module.exports = SubscriptionClient;