import LazyPromise from "@ai-zen/lazy-promise";
import { formatError, generateToken } from "./utils.js";

export interface Adapter {
  addEventListener(callback: (payload: any) => void): void;
  removeEventListener(callback: (payload: any) => void): void;
  postMessage(payload: any): void;
}

export type Method = (...args: any[]) => any;

export type Methods = Record<string, Method>;
export type CallRecord = Methods;

/**
 * Web Message Remote Procedure Call class.
 * @template T The type used in Web Message RPC.
 */
export default class WebMessageRPC<T> {
  callProxy = new Proxy(
    {},
    {
      /**
       * Captures method calls through the proxy, converts them to messages, and sends them to the other end using the adapter.
       * @param _target The proxy target object.
       * @param methodName The name of the called method.
       * @returns Returns a Promise object to receive the call result.
       */
      get: (_target, methodName) => {
        return (...args: any[]) => {
          // Iterate through the arguments. If a function is encountered, replace it with an object containing callback function information.
          args = args.map((arg: any) =>
            typeof arg == "function"
              ? (() => {
                  const callbackMethodName = `callback-${generateToken()}`;
                  this.callMap.set(callbackMethodName, arg);
                  return { __rpc_callback__: true, callbackMethodName };
                })()
              : arg
          );

          // Generate a token to identify the request.
          const token = generateToken();
          // Send the message to the other end using the adapter.
          this.adapter?.postMessage({
            type: "call",
            method: methodName,
            args,
            token,
          });

          return new LazyPromise((resolve, reject) => {
            // Save the resolve and reject functions to the promiseMap for handling the call result later.
            this.promiseMap.set(token, { resolve, reject });
          });
        };
      },
    }
  ) as T;

  callMap: Map<string, Method>;
  private _messageHandler: (payload: any) => void;
  adapter: Adapter;
  promiseMap = new Map<
    string,
    { resolve: (value: unknown) => void; reject: (reason?: any) => void }
  >();

  /**
   * Creates a new WebMessageRPC instance.
   * @param adapter The adapter object used for sending and receiving messages.
   * @param methods The call record, which can be an object containing methods.
   */
  constructor(adapter: WebMessageRPC<T>["adapter"], methods?: Methods) {
    this.callMap = new Map(Object.entries(methods ?? {}));
    this._messageHandler = this.messageHandler.bind(this);
    this.adapter = adapter;
    this.adapter!.addEventListener(this._messageHandler!);
  }

  /**
   * Destroys the instance and clears callback functions and Promise objects.
   */
  destroy() {
    this.adapter!.removeEventListener(this._messageHandler!);
    this._messageHandler = undefined as any;
    this.promiseMap.clear();
    this.callProxy = undefined as any;
    this.callMap.clear();
    this.adapter = undefined as any;
  }

  /**
   * Handles incoming messages.
   * @param payload The incoming message.
   */
  async messageHandler(payload: any) {
    // If it's a call message and there's a corresponding method, execute the call and send the result back to the other end.
    if (
      payload?.type === "call" &&
      payload?.method &&
      this.callMap.has(payload.method)
    ) {
      try {
        // Replace callback functions in the arguments with the actual callback functions and execute the call.
        payload.args = payload.args.map((arg: any) =>
          arg?.__rpc_callback__
            ? (...callbackArgs: any[]) => {
                return (this.callProxy as any)[arg.callbackMethodName](
                  ...callbackArgs
                );
              }
            : arg
        );

        const data = await this.callMap.get(payload.method)!(
          ...(payload.args || [])
        );

        // Send the call result back to the other end.
        this.adapter?.postMessage({
          type: "call-result",
          result: "success",
          data,
          token: payload.token,
        });
      } catch (error: any) {
        // If there's an error during the call, send the error information back to the other end.
        this.adapter?.postMessage({
          type: "call-result",
          result: "fail",
          error: formatError(error),
          token: payload.token,
        });
      }
    }

    // If it's a call result message and there's a corresponding Promise object, handle it based on the result.
    if (payload?.type === "call-result" && this.promiseMap.has(payload.token)) {
      const { resolve, reject } = this.promiseMap.get(payload.token)!;
      if (payload.result === "success") {
        // If the call is successful, use the resolve function to return the result.
        resolve(payload.data);
      }
      if (payload.result === "fail") {
        // If the call fails, use the reject function to return the error.
        reject(payload.error);
      }
      // Delete the corresponding Promise object.
      this.promiseMap.delete(payload.token);
    }
  }

  /**
   * Registers a group of methods to the call record.
   * @param methods The call record, which can be an object containing methods.
   * @returns The registered call record.
   */
  register<C extends Methods>(methods: C): Required<C>;
  /**
   * Registers a group of methods to the call record with a specified namespace.
   * @param namespace The namespace.
   * @param methods The call record, which can be an object containing methods.
   * @returns The registered call record.
   */
  register<C extends Methods>(namespace: string, methods: C): Required<C>;
  register<C extends Methods>(arg1: string | C, arg2?: C): Required<C> {
    let namespace: string;
    let methods: C | undefined;
    if (typeof arg1 == "string") namespace = arg1;
    if (typeof arg1 == "object") methods = arg1;
    if (typeof arg2 == "object") methods = arg2;
    if (!methods) throw new Error("'methods' cannot be undefined.");
    Object.entries(methods).forEach(([methodName, value]) => {
      let key = namespace ? `${namespace}:${methodName}` : methodName;
      this.callMap.set(key, value);
    });
    return methods as Required<C>;
  }

  /**
   * Deregisters a group of methods from the call record.
   * @param methods The call record, which can be an object containing methods.
   * @returns The deregistered call record.
   */
  deregister<C extends Methods>(methods: C): Required<C>;
  /**
   * Deregisters a group of methods from the call record with a specified namespace.
   * @param namespace The namespace.
   * @param methods The call record, which can be an object containing methods.
   * @returns The deregistered call record.
   */
  deregister<C extends Methods>(namespace: string, methods: C): Required<C>;
  deregister<C extends Methods>(arg1: string | C, arg2?: C): Required<C> {
    let namespace: string;
    let methods: C | undefined;
    if (typeof arg1 == "string") namespace = arg1;
    if (typeof arg1 == "object") methods = arg1;
    if (typeof arg2 == "object") methods = arg2;
    if (!methods) throw new Error("'methods' cannot be undefined.");
    Object.entries(methods).forEach(([methodName]) => {
      let key = namespace ? `${namespace}:${methodName}` : methodName;
      this.callMap.delete(key);
    });
    return methods as Required<C>;
  }

  /**
   * Creates a proxy object for a namespace, used to call methods under that namespace.
   * @param namespace The namespace.
   * @returns The proxy object for the namespace.
   */
  use<C extends Methods>(namespace: string): C {
    return new Proxy(
      {},
      {
        get: (_target, methodName: string) => {
          let key = namespace ? `${namespace}:${methodName}` : methodName;
          return this.callProxy[key];
        },
      }
    ) as C;
  }
}
