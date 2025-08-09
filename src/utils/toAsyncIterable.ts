export async function* toAsyncIterable(
  src: ReadableStream<string | Uint8Array> | AsyncIterable<string | Uint8Array>
) {
  if (isAsyncIterable(src)) {
    for await (const c of src as AsyncIterable<string | Uint8Array>) yield c;
    return;
  }
  const stream = src as ReadableStream<string | Uint8Array>;
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value != null) yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

function isAsyncIterable(v: any): v is AsyncIterable<any> {
  return v && typeof v[Symbol.asyncIterator] === "function";
}
