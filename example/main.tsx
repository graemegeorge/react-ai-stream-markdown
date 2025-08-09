import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { StreamMarkdown } from 'react-ai-stream-markdown'

function makeStream(text: string, delay = 30): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  let i = 0
  return new ReadableStream({
    start(controller) {
      const id = setInterval(() => {
        if (i >= text.length) {
          clearInterval(id)
          controller.close()
          return
        }
        const next = text.slice(i, i + 6)
        controller.enqueue(enc.encode(next))
        i += 6
      }, delay)
    }
  })
}

const sample = `# Streaming **Markdown**

This is a demo. It supports:

- **Bold**, *italics*, \`code\`
- Links: [example](https://example.com)
- Headings up to h3
- Images are blocked unless allowlisted: ![x](https://images.example.com/pic.png)

Thanks for trying it out!
`

function App() {
  const [stream, setStream] = useState<ReadableStream<Uint8Array> | null>(null)

  return (
    <div className="prose">
      <div className="box">
        {stream ? (
          <StreamMarkdown
            source={stream}
            renderIntervalMs={50}
            autoScroll
            allowedImageHosts={['images.example.com']}
          />
        ) : (
          <em>Click Start to stream</em>
        )}
      </div>

      <div className="controls">
        <button id="start" onClick={() => setStream(makeStream(sample, 18))}>Start stream</button>
        <button id="reset" onClick={() => setStream(null)}>Reset</button>
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
