
export function createChatSSEStream(): ReadableStream<Uint8Array> {
  // Return an empty stream that closes immediately
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.close();
    },
  });
}

