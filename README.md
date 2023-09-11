English | [简体中文](./README.cn.md)

# Web Message RPC

Web Message RPC is a class for implementing Remote Procedure Call (RPC) between web applications.

## Installation

Install the class using npm:

```
npm install web-message-rpc
```

## Usage

### Import the `WebMessageRPC` class:

```typescript
import { WebMessageRPC, Adapter } from "web-message-rpc";
```

### Register methods on one end and call methods on the other end:

- Register methods on the A end using a WebMessageRPC instance:

```typescript
// Create a WebMessageRPC instance using the adapter object:
const rpc = new WebMessageRPC(adapter);

// Register methods to the WebMessageRPC instance
rpc.register({
  add(a: number, b: number) {
    return a + b;
  },
  subtract(a: number, b: number) {
    return a - b;
  },
});
```

- Now, you can call the registered methods on the B end using the WebMessageRPC instance:

```typescript
// Create a WebMessageRPC instance using the adapter object:
const rpc = new WebMessageRPC(adapter);

async function main() {
  // Call the methods provided by the A end through rpc.callProxy, just like calling regular functions.
  const result = await rpc.callProxy.add(1, 2);
  console.log(result); // Output: 3
}

main();
```

### Using namespaces:

- On the A end, register methods and specify a namespace:

```typescript
// Create a WebMessageRPC instance using the adapter object:
const rpc = new WebMessageRPC(adapter);

// When registering methods, specify the namespace as the first parameter.
rpc.register("myNamespace", {
  add(a: number, b: number) {
    return a + b;
  },
  subtract(a: number, b: number) {
    return a - b;
  },
});
```

- On the B end, use the specified namespace:

```typescript
// Create a WebMessageRPC instance using the adapter object:
const rpc = new WebMessageRPC(adapter);

// Use the specified namespace to get the proxy object.
const myNamespace = rpc.use("myNamespace");

async function main() {
  // Call the methods more succinctly through the namespace.
  const result = await myNamespace.add(1, 2);
  console.log(result); // Output: 3
}

main();
```

### Create an `Adapter` object for sending and receiving messages. The adapter object needs to implement the following interface:

```typescript
interface Adapter {
  addEventListener(callback: Function): void;
  removeEventListener(callback: Function): void;
  postMessage(payload: any): void;
}
```

WebSocket adapter example:

- Server-side

```typescript
let handler;
const adapter: Adapter = {
  addEventListener(callback) {
    handler = (str) => callback(JSON.parse(str));
    ws.on("message", handler);
  },
  removeEventListener(callback) {
    ws.off("message", handler);
  },
  postMessage(payload) {
    ws.send(JSON.stringify(payload));
  },
};
```

- Client-side

```typescript
let handler;
const adapter: Adapter = {
  addEventListener(callback) {
    handler = (str) => callback(JSON.parse(str));
    ws.addEventListener("message", handler);
  },
  removeEventListener(callback) {
    ws.removeEventListener("message", handler);
  },
  postMessage(payload) {
    ws.send(JSON.stringify(payload));
  },
};
```

> Note: When using WebSocket communication, you need to implement data serialization and deserialization yourself. `JSON.stringify()` and `JSON.parse()` are just one simple way.

iframe adapter example:

- Parent page

```typescript
let handler;
const adapter: Adapter = {
  addEventListener(callback) {
    handler = (e) => callback(e.data);
    window.addEventListener("message", handler);
  },
  removeEventListener(callback) {
    window.removeEventListener("message", handler);
  },
  postMessage(payload) {
    iframe.contentWindow.postMessage(payload);
  },
};
```

- Child page

```typescript
let handler;
const adapter: Adapter = {
  addEventListener(callback) {
    handler = (e) => callback(e.data);
    window.addEventListener("message", handler);
  },
  removeEventListener(callback) {
    window.removeEventListener("message", handler);
  },
  postMessage(payload) {
    window.parent.postMessage(payload);
  },
};
```

## Methods

### register

Register a collection of methods to the call record.

```typescript
register(callRecord: {[methodName: string]: (...args: any[]) => any})
register(namespace: string, callRecord: {[methodName: string]: (...args: any[]) => any})
```

- `callRecord`: The collection of methods to be registered, including the method names and corresponding functions.
- `namespace`: Optional parameter for namespace.

### deregister

Unregister a method or a collection of methods from the call record.

```typescript
deregister(callRecord: {[methodName: string]: (...args: any[]) => any})
deregister(namespace: string, callRecord: {[methodName: string]: (...args: any[]) => any})
```

- `callRecord`: The collection of methods to be unregistered, including the method names and corresponding functions.
- `namespace`: Optional parameter for namespace.

### use

Create a proxy object for a namespace, used to call methods under that namespace.

```typescript
use(namespace: string): {[methodName: string]: (...args: any[]) => any};
```

- `namespace`: The namespace.

### destroy

Destroy the WebMessageRPC instance and clear callback functions and Promise objects.

## Contributing

Your contributions and suggestions are welcome!
