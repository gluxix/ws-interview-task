class BaseError extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
  }
}

class BadPayload extends BaseError {
  constructor(cause) {
    super('Bad formatted payload, non JSON', cause);
  }
}

class InvalidCommand extends BaseError {
  constructor(cause) {
    super('Requested method not implemented', cause);
  }
}

module.exports = {
  BadPayload,
  InvalidCommand,
};
