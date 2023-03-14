const assert = require('assert');

const Subscriptions = require('../../src/server/Subscriptions');

describe('Subscription', () => {
  describe('#subscribe()', () => {
    it('should return the subscription date', async () => {
      const subscriptions = new Subscriptions(0, 0);

      const date = await subscriptions.subscribe({});

      assert(date > 0);
    });

    it('should return the same date when invoked few times for the same subscriber', async () => {
      const subscriptions = new Subscriptions(5, 0);
      const subscriber = {};

      const [firstDate, secondDate] = await Promise.all([
        subscriptions.subscribe(subscriber),
        subscriptions.subscribe(subscriber),
      ]);
      const thirdDate = await subscriptions.subscribe(subscriber);

      assert(firstDate === secondDate);
      assert(secondDate === thirdDate);
    });

    it('should return different dates when invoked for different subscribers', async () => {
      const subscriptions = new Subscriptions(5, 0);
      const firstSubscriber = {};
      const secondSubscriber = {};

      const firstDate = await subscriptions.subscribe(firstSubscriber);
      const secondDate = await subscriptions.subscribe(secondSubscriber);

      assert(firstDate !== secondDate);
    });
  });

  describe('#unsubscribe()', () => {
    it('should return the unsubscription date', async () => {
      const subscriptions = new Subscriptions(0, 0);

      const date = await subscriptions.unsubscribe({});

      assert(date > 0);
    });

    it('should return the same date when invoked few times for the same subscriber', async () => {
      const subscriptions = new Subscriptions(5, 0);
      const subscriber = {};

      const [firstDate, secondDate] = await Promise.all([
        subscriptions.unsubscribe(subscriber),
        subscriptions.unsubscribe(subscriber),
      ]);
      const thirdDate = await subscriptions.unsubscribe(subscriber);

      assert(firstDate === secondDate);
      assert(secondDate === thirdDate);
    });

    it('should return different dates when invoked for different subscribers', async () => {
      const subscriptions = new Subscriptions(5, 0);
      const firstSubscriber = {};
      const secondSubscriber = {};

      const firstDate = await subscriptions.unsubscribe(firstSubscriber);
      const secondDate = await subscriptions.unsubscribe(secondSubscriber);

      assert(firstDate !== secondDate);
    });
  });

  describe('#subscribersCount()', () => {
    it('should return zero if there are no subscriptions', async () => {
      const subscriptions = new Subscriptions(0, 0);

      assert(subscriptions.subscribersCount() === 0);
    });

    it('should return correct the amount of subscribers', async () => {
      const subscriptions = new Subscriptions(0, 0);
      const subscriber = {};

      await subscriptions.subscribe({});
      await subscriptions.subscribe({});
      await subscriptions.subscribe({});

      assert(subscriptions.subscribersCount() === 3);

      await subscriptions.subscribe(subscriber);
      await subscriptions.subscribe(subscriber);

      assert(subscriptions.subscribersCount() === 4);

      await subscriptions.unsubscribe(subscriber);

      assert(subscriptions.subscribersCount() === 3);
    });
  });

  describe('#clear()', () => {
    it('should remove subscription', async () => {
      const subscriptions = new Subscriptions(0, 0);
      const subscriber = {};

      await subscriptions.subscribe(subscriber);
      await subscriptions.clear(subscriber);

      assert(subscriptions.subscribersCount() === 0);
    });

    it('should not remove another subscription', async () => {
      const subscriptions = new Subscriptions(0, 0);
      const subscriber = {};

      await subscriptions.subscribe(subscriber);
      await subscriptions.clear({});

      assert(subscriptions.subscribersCount() === 1);
    });
  });

  describe('#clearAll()', () => {
    it('should remove all subscriptions', async () => {
      const subscriptions = new Subscriptions(0, 0);

      await subscriptions.subscribe({});
      await subscriptions.subscribe({});
      await subscriptions.subscribe({});

      await subscriptions.clearAll();

      assert(subscriptions.subscribersCount() === 0);
    });
  });
});
