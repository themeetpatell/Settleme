// SettleMe — tiny markdown renderer for AI assistant messages.
//
// Supports: blank-line paragraphs, # / ## / ### headers, - bullets,
// numbered lists, **bold**, *italic*, `inline code`, raw URLs, fenced code.

import { View, Linking, type StyleProp, type TextStyle } from 'react-native';
import { Text } from './Text';

interface MarkdownTextProps {
  source: string;
  className?: string;
}

interface InlineToken {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
}

const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\bhttps?:\/\/\S+)/g;

function parseInline(line: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of line.matchAll(INLINE_RE)) {
    const idx = match.index ?? 0;
    if (idx > last) tokens.push({ text: line.slice(last, idx) });
    const t = match[0];
    if (t.startsWith('**')) tokens.push({ text: t.slice(2, -2), bold: true });
    else if (t.startsWith('*')) tokens.push({ text: t.slice(1, -1), italic: true });
    else if (t.startsWith('`')) tokens.push({ text: t.slice(1, -1), code: true });
    else if (t.startsWith('http')) tokens.push({ text: t, href: t });
    else tokens.push({ text: t });
    last = idx + t.length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last) });
  return tokens;
}

function renderInline(line: string) {
  const tokens = parseInline(line);
  return tokens.map((t, i) => {
    const style: StyleProp<TextStyle> = [
      t.bold ? { fontWeight: '700' as const } : null,
      t.italic ? { fontStyle: 'italic' as const } : null,
    ];
    if (t.href) {
      return (
        <Text
          key={i}
          tone="accent"
          style={[{ textDecorationLine: 'underline' as const }, ...style]}
          onPress={() => Linking.openURL(t.href!).catch(() => undefined)}
        >
          {t.text}
        </Text>
      );
    }
    if (t.code) {
      return (
        <Text key={i} variant="mono" className="bg-ink-100 px-1.5 dark:bg-ink-700">
          {t.text}
        </Text>
      );
    }
    return (
      <Text key={i} style={style}>
        {t.text}
      </Text>
    );
  });
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'numbered'; items: string[] }
  | { type: 'code'; text: string };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let buffer: string[] = [];
  let listItems: string[] = [];
  let listType: 'bullets' | 'numbered' | null = null;
  let inCode = false;
  let codeBuffer: string[] = [];

  const flushParagraph = () => {
    if (buffer.length > 0) {
      blocks.push({ type: 'p', text: buffer.join(' ').trim() });
      buffer = [];
    }
  };
  const flushList = () => {
    if (listType && listItems.length > 0) {
      blocks.push(
        listType === 'bullets'
          ? { type: 'bullets', items: listItems }
          : { type: 'numbered', items: listItems },
      );
    }
    listItems = [];
    listType = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', text: codeBuffer.join('\n') });
        codeBuffer = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(raw);
      continue;
    }

    if (line === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const hMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (hMatch) {
      flushParagraph();
      flushList();
      const hashes = hMatch[1] ?? '';
      const depth = hashes.length;
      blocks.push({
        type: depth === 1 ? 'h1' : depth === 2 ? 'h2' : 'h3',
        text: hMatch[2] ?? '',
      });
      continue;
    }

    const numMatch = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (numMatch) {
      flushParagraph();
      if (listType !== 'numbered') flushList();
      listType = 'numbered';
      listItems.push(numMatch[1] ?? '');
      continue;
    }

    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      flushParagraph();
      if (listType !== 'bullets') flushList();
      listType = 'bullets';
      listItems.push(bulletMatch[1] ?? '');
      continue;
    }

    flushList();
    buffer.push(line);
  }
  flushParagraph();
  flushList();
  if (inCode && codeBuffer.length > 0) {
    blocks.push({ type: 'code', text: codeBuffer.join('\n') });
  }
  return blocks;
}

export function MarkdownText({ source, className }: MarkdownTextProps) {
  const blocks = parseBlocks(source);
  return (
    <View className={`gap-2 ${className ?? ''}`}>
      {blocks.map((block, i) => {
        if (block.type === 'h1') {
          return (
            <Text key={i} variant="h1" className="mt-2">
              {renderInline(block.text)}
            </Text>
          );
        }
        if (block.type === 'h2') {
          return (
            <Text key={i} variant="h2" className="mt-2">
              {renderInline(block.text)}
            </Text>
          );
        }
        if (block.type === 'h3') {
          return (
            <Text key={i} variant="h3" className="mt-2">
              {renderInline(block.text)}
            </Text>
          );
        }
        if (block.type === 'bullets') {
          return (
            <View key={i} className="gap-1.5">
              {block.items.map((item, j) => (
                <View key={j} className="flex-row gap-2">
                  <Text variant="body" tone="muted">
                    •
                  </Text>
                  <Text variant="body" className="flex-1">
                    {renderInline(item)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        if (block.type === 'numbered') {
          return (
            <View key={i} className="gap-1.5">
              {block.items.map((item, j) => (
                <View key={j} className="flex-row gap-2">
                  <Text variant="body" tone="muted" className="font-semibold">
                    {j + 1}.
                  </Text>
                  <Text variant="body" className="flex-1">
                    {renderInline(item)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        if (block.type === 'code') {
          return (
            <View key={i} className="rounded-xl bg-ink-900 p-3 dark:bg-ink-950">
              <Text variant="mono" tone="inverse">
                {block.text}
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} variant="body">
            {renderInline(block.text)}
          </Text>
        );
      })}
    </View>
  );
}
