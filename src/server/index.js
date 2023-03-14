const { WebSocketServer } = require('ws');

const Subscriptions = require('./Subscriptions');
const { Commands } = require('../constants');
const { InvalidCommand, BadPayload } = require('./errors');

const DEFAULT_OPTS = {
  heartbeatInterval: 1000,
  subscribeDelay: 4000,
  unsubscribeDelay: 8000,
}

class SubscribeServer {
  #opts;
  #wsServer;
  #heartbeatTimer;
  #subsctiptions;

  /**
   * @param {object} [opts] Server options 
   * @param {number} opts.heartbeatInterval Heartbeat interval in ms (default: 1000)
   * @param {number} opts.subscribeDelay Subscribe delay in ms before the response (default: 4000)
   * @param {number} opts.unsubscribeDelay Subscribe delay in ms before the response (default: 8000)
   */
  constructor(opts = {}) {
    this.#opts = { ...DEFAULT_OPTS, ...opts };
    this.#wsServer = null;
    this.#heartbeatTimer = null;
    this.#subsctiptions = new Subscriptions(this.#opts.subscribeDelay, this.#opts.unsubscribeDelay);
  }

  /**
   * Starts listening to incoming connections and returns the WS server instance.
   * @param {number} port Server port.
   * @returns {WebSocketServer}
   */
  listen(port) {
    if (this.#wsServer) {
      console.warn(`Server is already listening on port: ${port}`);
      return this.wsServer;
    }

    this.#wsServer = new WebSocketServer({ port, clientTracking: true });

    this.#wsServer
      .once('listening', () => {
        this.#startHeartbeat();
      })
      .on('connection', (client) => {
        client
          .on('message', (data) => {
            this.#handleMessage(client, data);
          })
          .on('close', () => {
            this.#subsctiptions.clear(client);
          })
          .on('error', (err) => {
            console.error(err);
          });
      });

    return this.#wsServer;
  }

  gracefulShutdown() {
    this.#stopHeartbeat();
    this.#wsServer.close((err) => {
      if (err) {
        console.error(err);
      }
    });
    console.info('Server is stopping to listen new connections');
    let clientsCount = 0;
    this.#wsServer.clients.forEach((client) => {
      client.close();
      clientsCount++;
    })
    console.info(`${clientsCount} connections have been closed`);
  }

  #startHeartbeat() {
    if (this.#opts.heartbeatInterval <= 0) {
      console.warn('Heartbeating is disabled');
      return;
    }

    if (this.#heartbeatTimer) {
      console.warn('Heartbeating was already started');
      return;
    }

    this.#heartbeatTimer = setInterval(() => {
      this.#wsServer.clients.forEach((client) => {
        // if (client.isAlive !== true) {
        //   return client.terminate();
        // }

        // client.isAlive = false;
        this.#send(client, {
          type: Commands.Heartbeat,
          updatedAt: Date.now(),
        });
      });
    }, this.#opts.heartbeatInterval);

    console.log(`Heartbeating each ${this.#opts.heartbeatInterval}ms has been started`);
  }

  #stopHeartbeat() {
    clearInterval(this.#heartbeatTimer);
    this.#heartbeatTimer = null;
  }

  #handleMessage(client, data) {
    try {
      const payload = this.#parseData(data);
      this.#validateCommand(payload);
      this.#handleCommand(client, payload);
    } catch (err) {
      console.error(err);
      this.#sendError(client, err);
    }
  }

  #parseData(data) {
    try {
      return JSON.parse(data.toString());
    } catch (err) {
      throw new BadPayload(err);
    }
  }

  #validateCommand(payload) {
    if (!payload || !Object.values(Commands).includes(payload.type)) {
      throw new InvalidCommand();
    }
  }

  #handleCommand(client, payload) {
    switch (payload.type) {
      case Commands.Subscribe: {
        this.#handleSubscribe(client);
        break;
      }
      case Commands.Unsubscribe: {
        this.#handleUnsubscribe(client);
        break;
      }
      case Commands.CountSubscribers: {
        this.#handleCountSubscribers(client);
        break;
      }
      case Commands.Heartbeat: {
        client.isAlive = true;
        break;
      }
      default: {
        throw new InvalidCommand();
      } 
    }
  }

  #handleSubscribe(client) {
    this.#subsctiptions.subscribe(client)
      .then((subscriptionDate) => {
        this.#send(client, {
          type: Commands.Subscribe,
          status: 'Subscribed',
          updatedAt: subscriptionDate,
        })
      })
      .catch((_) => {
        // Ignore
      });
  }

  #handleUnsubscribe(client) {
    this.#subsctiptions.unsubscribe(client)
      .then((unsubscriptionDate) => {
        this.#send(client, {
          type: Commands.Unsubscribe,
          status: 'Unsubscribed',
          updatedAt: unsubscriptionDate,
        })
      })
      .catch((_) => {
        // Ignore
      });
  }

  #handleCountSubscribers(client) {  
    this.#send(client, {
      type: Commands.CountSubscribers,
      count: this.#subsctiptions.subscribersCount(),
      updatedAt: Date.now(),
    });
  }

  #sendError(client, err) {
    const data = {
      type: 'Error',
      error: err.message || 'Unknown error',
      updatedAt: Date.now(),
    };

    this.#send(client, data);
  }
  
  #send(client, data) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data), (err) => {
        if (err) {
          console.error(err);
        }
      });
    } else {
      console.warn(`Trying to send a message to the client with state: ${client.readyState}`);
    }
  }
}

module.exports = SubscribeServer;
