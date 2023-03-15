# The websockets interview task

## Server

```sh
npm run start:server
```

You can configure the server via environment variables:

```
# WS server port
PORT=8080
# Heartbeat interval in ms
HB_INT=1000
```


```sh
PORT=9090 HB_INT=2000 npm run start:server
```

## Client

```sh
npm run start:client
```

The client app interacts with user via stdin, available commands:
- s - sends subscribe
- u - sends unsubscribe
- c - sends countSubscribers

Both, server and client writes logs to stdout. To silence heartbeat messages in the client app, you can pass SILENCE_HB=true env.

```
SERVER_ADDRESS='ws://127.0.0.1:8080'
SILENCE_HB='true'
```

```sh
SERVER_ADDRESS='ws://127.0.0.1:8080' SILENCE_HB='true' npm run start:client
```

## Testing

```sh
npm run test:unit
npm run test:integration
```
