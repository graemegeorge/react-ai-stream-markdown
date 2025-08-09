import { describe, it, expect } from 'vitest'
import { toAsyncIterable } from '../src/utils/toAsyncIterable'

async function collect<T>(it: AsyncIterable<T>) {
  const out: T[] = []
  for await (const v of it) out.push(v)
  return out
}

describe('toAsyncIterable', () => {
  it('passes through AsyncIterable<string>', async () => {
    async function* gen() { yield 'a'; yield 'b'; yield 'c'; }
    const arr = await collect(toAsyncIterable(gen()))
    expect(arr).toEqual(['a','b','c'])
  })

  it('reads from ReadableStream<Uint8Array>', async () => {
    const enc = new TextEncoder()
    const rs = new ReadableStream<Uint8Array>({
      start(ctrl) {
        ctrl.enqueue(enc.encode('hel'))
        ctrl.enqueue(enc.encode('lo'))
        ctrl.close()
      }
    })
    const chunks = await collect(toAsyncIterable(rs))
    const txt = new TextDecoder().decode(Buffer.concat(chunks as any))
    expect(txt).toBe('hello')
  })
})
