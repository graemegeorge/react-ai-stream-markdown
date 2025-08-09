import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeMarkdown, type ComponentsMap } from "safe-markdown-react";
import { toAsyncIterable } from "./utils/toAsyncIterable.js";
import { Coalescer } from "./utils/coalescer.js";

export type StreamSource =
  | ReadableStream<string | Uint8Array>
  | AsyncIterable<string | Uint8Array>;

export interface StreamMarkdownProps {
  source: StreamSource;
  initialText?: string;
  renderIntervalMs?: number; // coalesce updates
  autoScroll?: boolean;
  onChunk?: (chunk: string, full: string) => void;
  onComplete?: (full: string) => void;
  // passthrough to safe-markdown-react
  allowedImageHosts?: string[];
  allowedSchemes?: string[];
  maxHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  components?: ComponentsMap;
  className?: string;
}

export function StreamMarkdown(props: StreamMarkdownProps) {
  const {
    source,
    initialText = "",
    renderIntervalMs = 32,
    autoScroll = false,
    onChunk,
    onComplete,
    allowedImageHosts,
    allowedSchemes,
    maxHeadingLevel,
    components,
    className,
  } = props;

  const [text, setText] = useState<string>(initialText);
  const hostRef = useRef<HTMLDivElement | null>(null);

  // convert to async iterable of strings
  const iterable = useMemo(() => toAsyncIterable(source), [source]);

  useEffect(() => {
    let full = initialText;
    let cancelled = false;
    const decoder = new TextDecoder();

    const coalescer = new Coalescer(renderIntervalMs, (out) => {
      if (cancelled) return;
      full += out;
      setText((prev) => prev + out);
      onChunk?.(out, full);
      if (autoScroll && hostRef.current) {
        hostRef.current.scrollTop = hostRef.current.scrollHeight;
      }
    });
    coalescer.start();

    (async () => {
      try {
        for await (const chunk of iterable) {
          if (cancelled) break;
          const str =
            typeof chunk === "string"
              ? chunk
              : decoder.decode(chunk, { stream: true });
          coalescer.add(str);
        }
        coalescer.stop(true);
        onComplete?.(full);
      } catch {
        // ignore
      } finally {
        // timer cleared by stop()
      }
    })();

    return () => {
      cancelled = true;
      coalescer.stop(true);
    };
  }, [
    iterable,
    renderIntervalMs,
    autoScroll,
    onChunk,
    onComplete,
    initialText,
  ]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ overflowY: autoScroll ? ("auto" as const) : undefined }}
    >
      <SafeMarkdown
        markdown={text}
        allowedImageHosts={allowedImageHosts}
        allowedSchemes={allowedSchemes}
        maxHeadingLevel={maxHeadingLevel}
        components={components}
      />
    </div>
  );
}

export default StreamMarkdown;
