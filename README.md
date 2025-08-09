# react-ai-stream-markdown

> Stream AI/UGC Markdown into React safely with coalescing, callbacks, and auto-scroll. Renders via **safe-markdown-react**.

Perfect for LLM chat UIs: pass a **ReadableStream** or **AsyncIterable** and render as the text arrives.

---

## Features

- ✅ Accepts `ReadableStream<string|Uint8Array>` **or** `AsyncIterable<string>`
- ✅ Coalesces chunks (reduce re-renders) with `renderIntervalMs`
- ✅ `onChunk` / `onComplete` callbacks
- ✅ Optional auto-scroll to bottom
- ✅ Renders safely via `safe-markdown-react` (sanitized, link policy, image allowlist)
- ✅ Typed, React 18+, ESM

---

## Install

```bash
npm i react-ai-stream-markdown safe-markdown-react
# peer deps: react, react-dom >= 18
```

---

## Usage

### 1) With a Web ReadableStream (e.g., fetch from your API)

```tsx
import { StreamMarkdown } from 'react-ai-stream-markdown';

function ChatMessage({ stream }: { stream: ReadableStream<Uint8Array> }) {
  return (
    <StreamMarkdown
      source={stream}
      renderIntervalMs={50}
      autoScroll
      allowedImageHosts={['images.example.com']}
    />
  );
}
```

### 2) With an AsyncIterable (e.g., SDK that yields tokens)

```tsx
import { StreamMarkdown } from 'react-ai-stream-markdown';

async function* toky() {
  yield 'Hello'; yield ' '; yield '**world**';
}

<StreamMarkdown source={toky()} />;
```

### Props

```ts
type StreamSource =
  | ReadableStream<string | Uint8Array>
  | AsyncIterable<string | Uint8Array>;

interface StreamMarkdownProps {
  source: StreamSource;
  initialText?: string;
  renderIntervalMs?: number;   // default 32ms
  autoScroll?: boolean;        // default false
  onChunk?: (chunk: string, full: string) => void;
  onComplete?: (full: string) => void;
  // Pass-through to safe-markdown-react
  allowedImageHosts?: string[];
  allowedSchemes?: string[];
  maxHeadingLevel?: 1|2|3|4|5|6;
  components?: Record<string, React.ComponentType<any>>;
}
```

---

## OpenAI streaming example

### Server (Next.js App Router)

Create `app/api/chat/route.ts`:

```ts
export const runtime = 'edge'; // optional
export async function POST(req: Request) {
  const body = await req.json();
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY!}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // or latest
      stream: true,
      messages: body.messages,
    }),
  });

  if (!r.ok || !r.body) {
    return new Response('Upstream error', { status: 500 });
  }

  // Pipe the upstream ReadableStream to the client unmodified
  // (Optionally, transform SSE → plain text here.)
  return new Response(r.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client

```tsx
import { StreamMarkdown } from 'react-ai-stream-markdown';

async function startChat(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.body) throw new Error('No stream');
  return res.body; // ReadableStream<Uint8Array>
}

// in your component
const [stream, setStream] = useState<ReadableStream<Uint8Array> | null>(null);

<button onClick={async () => setStream(await startChat([{ role: 'user', content: 'Hello' }]))}>
  Ask
</button>

{stream && <StreamMarkdown source={stream} autoScroll renderIntervalMs={40} />}
```

> If you want Markdown specifically, make sure your system prompt tells the model to reply in Markdown.

---

## Notes

- We don’t parse tokens; we just append to a string and re-render **safe-markdown-react**. It’s fast enough for chat UIs.
- If your stream is `Uint8Array` chunks, we `TextDecoder` them as UTF-8.
- For extremely high-frequency streams, increase `renderIntervalMs` (e.g., 50–80ms).

---

## License

MIT
