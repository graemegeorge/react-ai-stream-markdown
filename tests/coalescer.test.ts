import { describe, it, expect, vi } from 'vitest'
import { Coalescer } from '../src/utils/coalescer'

describe('Coalescer', () => {
  it('coalesces strings by interval', () => {
    vi.useFakeTimers()
    const out: string[] = []
    const c = new Coalescer(50, (s) => out.push(s))
    c.start()
    c.add('a')
    vi.advanceTimersByTime(10)
    c.add('b')
    vi.advanceTimersByTime(50)
    expect(out).toEqual(['ab'])
    c.add('c')
    c.add('d')
    vi.advanceTimersByTime(60)
    expect(out).toEqual(['ab','cd'])
    c.stop(true)
    vi.useRealTimers()
  })
})
