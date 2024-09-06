# slidev-addon-sync

[![NPM version](https://img.shields.io/npm/v/slidev-addon-sync?color=3AB9D4&label=)](https://www.npmjs.com/package/slidev-addon-sync)

Sync component for [Slidev](https://sli.dev/).

This is compatible with the [slidev-sync-server](https://github.com/Smile-SA/slidev-sync-server) for the SSE or WebSocket server

See below for more examples.

## Installation

```bash
npm i slidev-addon-sync
```

## Slidev Configuration

Define this package into your slidev addons.

In your slides metadata (using Front Matter):

```
---
addons:
  - slidev-addon-sync
---
```

Or in your `package.json`:

```json
{
  "slidev": {
    "addons": ["slidev-addon-sync"]
  }
}
```

## Server configuration

You can use a Server Sent Events server or a WebSocket server to allow communication with multiple clients.

You can use [slidev-sync-server](https://github.com/Smile-SA/slidev-sync-server) or create your own implementation.

In that case you need to use the `syncSettings` config in your markdown file Front Matter to set the server URL (Update the value of `server` using your own URL).

For HTTP Server Sent Events server:

```yaml
---
syncSettings:
  server: http://localhost:8080
---
```

Or for WebSocket server:

```yaml
---
syncSettings:
  server: ws://localhost:8080
---
```

Then, in the presentation, click on the connect icon.

![Connect control icon](./assets/control-icon.png)

Type in a hash that you can share with other peoples and press <key>enter</key>. (you can use the proposed hash: everybody that are on the same presentation will have the same)

![Connect control hash](./assets/control-hash.png)

You are connected!

![Connected](./assets/connected.png)

You can also use the `autoConnect` settings to automatically connect to the server:

```yaml
---
syncSettings:
  server: http://localhost:8080
  autoConnect: true
---
```

Or provide a number of seconds. In that case you will need to connect the first time, and then if you refresh the page it will automatically reconnect you if the number of seconds since the last connection has not been elapsed:

```yaml
---
syncSettings:
  server: http://localhost:8080
  autoConnect: 86400 # one day
---
```
