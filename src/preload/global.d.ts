export {};

declare global {
  interface IPCResponse<T> {
    success: boolean;
    data: T;
    error?: string;
  }

  interface Window {
    request_server<T>(channel: string, ...args: unknown[]): Promise<IPCResponse<T>>;
  }
}
