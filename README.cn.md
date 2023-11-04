[English](./README.md) | 简体中文

# Web Message RPC

Web Message RPC 是一个用于实现 Web 应用间远程过程调用（RPC）的类。

## 安装

使用 npm 安装该类：

```
npm install web-message-rpc
```

## 使用方法

### 导入 `WebMessageRPC` 类：

```typescript
import { WebMessageRPC, Adapter } from "web-message-rpc";
```

### 在一端注册方法，并在另一端调用方法：

- 在 A 端通过 WebMessageRPC 实例注册方法：

```typescript
// 使用适配器对象创建一个 WebMessageRPC 实例：
const rpc = new WebMessageRPC(adapter);

// 将方法注册到 WebMessageRPC 实例
rpc.register({
  add(a: number, b: number) {
    return a + b;
  },
  subtract(a: number, b: number) {
    return a - b;
  },
});
```

- 现在，你可以在 B 端通过 WebMessageRPC 实例进行远程方法调用，如下所示：

```typescript
// 使用适配器对象创建一个 WebMessageRPC 实例：
const rpc = new WebMessageRPC(adapter);

async function main() {
  // 通过 rpc.callProxy 调用 A 端提供的方法，就像调用普通的函数一样。
  const result = await rpc.callProxy.add(1, 2);
  console.log(result); // 输出: 3
}

main();
```

### 使用命名空间：

- 在 A 端，注册方法，并指定命名空间：

```typescript
// 使用适配器对象创建一个 WebMessageRPC 实例：
const rpc = new WebMessageRPC(adapter);

// 在注册方法时，第一个参数填写命名空间
rpc.register("myNamespace", {
  add(a: number, b: number) {
    return a + b;
  },
  subtract(a: number, b: number) {
    return a - b;
  },
});
```

- 在 B 端，使用指定的命名空间：

```typescript
// 使用适配器对象创建一个 WebMessageRPC 实例：
const rpc = new WebMessageRPC(adapter);

// 指定命名空间获得代理对象
const myNamespace = rpc.use("myNamespace");

async function main() {
  // 通过命名空间可以更简洁地调用方法
  const result = await myNamespace.add(1, 2);
  console.log(result); // 输出: 3
}

main();
```

### 创建一个 `Adapter` 适配器对象，用于发送和接收消息。适配器对象需要实现以下接口：

```typescript
interface Adapter {
  addEventListener(callback: Function): void;
  removeEventListener(callback: Function): void;
  postMessage(payload: any): void;
}
```

WebSocket 适配器例子：

- 服务端

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

- 客户端

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

> 注意，在使用 WebSocket 通信时，您需要自行实现数据的序列化与反序列化，`JSON.stringify()` 和 `JSON.parse()` 只是最简单一种方式。

iframe 适配器例子：

- 父页面：

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

- 子页面：

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

## 方法

### register

将一个方法集合注册到调用记录中。

```typescript
register(methods: {[methodName: string]: (...args: any[]) => any})
register(namespace: string, methods: {[methodName: string]: (...args: any[]) => any})
```

- `methods`：要注册的方法集合对象，包含方法名和对应的函数。
- `namespace`：可选参数，用于命名空间。

### deregister

从调用记录中取消注册一个方法或方法集合。

```typescript
deregister(methods: {[methodName: string]: (...args: any[]) => any})
deregister(namespace: string, methods: {[methodName: string]: (...args: any[]) => any})
```

- `methods`：要取消注册的方法集合对象，包含方法名和对应的函数。
- `namespace`：可选参数，用于命名空间。

### use

创建一个命名空间的代理对象，用于调用该命名空间下的方法。

```typescript
use(namespace: string): {[methodName: string]: (...args: any[]) => any};
```

- `namespace`：命名空间。

### destroy

销毁 WebMessageRPC 实例，清空回调函数和 Promise 对象。

## 贡献

欢迎提供改进建议和报告问题。
