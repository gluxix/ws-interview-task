class Subscriptions {
  #subscriptions;
  #subscribeDelay;
  #unsubscribeDelay;

  constructor(subscribeDelay = 4000, unsubscribeDelay = 8000) {
    /**
     * Note: We could use the WeakMap and don't worry about leaks, but it doesn't implement size, values
     *  and so on. To count subscribers with WeakMap we have to use extra storage and manage it manually.
     *  Also, using the WeakMap we depends on GC and some responses can be with a wrong result.
     */
    this.#subscriptions = new Map();
    this.#subscribeDelay = subscribeDelay;
    this.#unsubscribeDelay = unsubscribeDelay;
  }

  /**
   * Creates the subscription for the subscriber and returns the date of subscription.
   * @param {any} subscriber Subscriber.
   * @returns {Promise<number>}
   */
  subscribe(subscriber) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const subscription = this.#subscriptions.get(subscriber);
        const now = subscription && subscription.subscribedAt || Date.now();
        this.#subscriptions.set(subscriber, { subscribedAt: now } );
        resolve(now);
      }, this.#subscribeDelay);
    });
  }

  /**
   * Removes the subscription for the subscriber and returns the date of unsubscription.
   * @param {any} subscriber Subscriber.
   * @returns {Promise<number>}
   */
  unsubscribe(subscriber) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const subscription = this.#subscriptions.get(subscriber);
        const now = subscription && subscription.unsubscribedAt || Date.now();
        this.#subscriptions.set(subscriber, { unsubscribedAt: now } );
        resolve(now);
      }, this.#unsubscribeDelay);
    });
  }

  /**
   * Returns the amount of active subscribers.
   * @returns {number}
   */
  subscribersCount() {
    let count = 0;
    for (const subscription of this.#subscriptions.values()) {
      if (subscription.subscribedAt > 0) {
        count++;
      }
    }
    return count;
  }

  /**
   * Removes all data of concrete subscriber.
   * @param {any} subscriber 
   */
  clear(subscriber) {
    this.#subscriptions.delete(subscriber);
  }

  /**
   * Removes all data of all subscribers.
   */
  clearAll() {
    this.#subscriptions.clear();
  }
}

module.exports = Subscriptions;
