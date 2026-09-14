// Mini-renderizador markdown em React: headings, bold/italic, code, listas,
// links, wikilinks, quote, hr, tabelas. Sem deps externas.
import React, { useMemo } from 'react';
import type { AtlasIndex } from '../data';
import { resolveNodeId } from '../data';

type Ctx = { index: AtlasIndex; onNode: (id: string) => void };

// Parser inline por varredura: `code`, [[wiki]], [texto](href), **bold**, *italic*
export function renderInline(text: string, ctx: Ctx): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0, key = 0;
  let buf = '';

  const flush = () => { if (buf) { out.push(<span key={key++}>{buf}</span>); buf = ''; } };
  const push = (node: React.ReactNode) => { flush(); out.push(node); };

  while (i < text.length) {
    const rest = text.slice(i);

    const code = rest.match(/^`([^`\n]+)`/);
    if (code) { push(<code key={key++}>{code[1]}</code>); i += code[0].length; continue; }

    const wiki = rest.match(/^\[\[([^\]|]+)\|([^\]]+)\]\]/);
    if (wiki) {
      const id = resolveNodeId(wiki[1], ctx.index);
      if (id) push(<a key={key++} data-node={id} onClick={() => ctx.onNode(id)}>{wiki[2]}</a>);
      else buf += wiki[2];
      i += wiki[0].length; continue;
    }
    const wikiPlain = rest.match(/^\[\[([^\]]+)\]\]/);
    if (wikiPlain) {
      const id = resolveNodeId(wikiPlain[1], ctx.index);
      if (id) push(<a key={key++} data-node={id} onClick={() => ctx.onNode(id)}>{wikiPlain[1]}</a>);
      else buf += wikiPlain[1];
      i += wikiPlain[0].length; continue;
    }

    const link = rest.match(/^\[([^\]]*)\]\(([^)\s]+)\)/);
    if (link) {
      const id = resolveNodeId(link[2], ctx.index);
      if (id) push(<a key={key++} data-node={id} onClick={() => ctx.onNode(id)}>{link[1]}</a>);
      else push(<a key={key++} href={link[2]} target="_blank" rel="noopener">{link[1]}</a>);
      i += link[0].length; continue;
    }

    const bold = rest.match(/^\*\*([^*]+)\*\*/);
    if (bold) { push(<strong key={key++}>{renderInline(bold[1], ctx)}</strong>); i += bold[0].length; continue; }

    const italic = rest.match(/^\*([^*\n]+)\*/);
    if (italic) { push(<em key={key++}>{renderInline(italic[1], ctx)}</em>); i += italic[0].length; continue; }

    buf += text[i];
    i++;
  }
  flush();
  return out;
}

export function Markdown({ md, index, onNode }: { md: string; index: AtlasIndex; onNode: (id: string) => void }) {
  const ctx = useMemo<Ctx>(() => ({ index, onNode }), [index, onNode]);
  const blocks = useMemo(() => {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const out: React.ReactNode[] = [];
    let para: string[] = [], list: { type: 'ul' | 'ol'; items: string[] } | null = null;
    let quote: string[] = [], code: string[] | null = null, table: string[] = [];
    let key = 0;

    const inline = (s: string) => renderInline(s, ctx);
    const flushPara = () => {
      if (para.length) {
        out.push(<p key={key++}>{para.flatMap(s => [...inline(s), <br key={'b' + key++} />]).slice(0, -1)}</p>);
        para = [];
      }
    };
    const flushList = () => {
      if (list) {
        const items = list.items.map((it, j) => <li key={j}>{inline(it)}</li>);
        out.push(list.type === 'ul' ? <ul key={key++}>{items}</ul> : <ol key={key++}>{items}</ol>);
        list = null;
      }
    };
    const flushQuote = () => {
      if (quote.length) {
        out.push(<blockquote key={key++}>{quote.map((q, j) => <p key={j}>{inline(q)}</p>)}</blockquote>);
        quote = [];
      }
    };
    const flushTable = () => {
      if (table.length) {
        const rows = table.filter(r => !/^\s*\|?[\s:|-]+\|?\s*$/.test(r))
          .map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
        if (rows.length) {
          const [head, ...body] = rows;
          out.push(
            <table key={key++}>
              <thead><tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
              <tbody>{body.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody>
            </table>);
        }
        table = [];
      }
    };
    const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable(); };

    for (const line of lines) {
      if (code) {
        if (/^```/.test(line)) { out.push(<pre key={key++}><code>{code.join('\n')}</code></pre>); code = null; }
        else code.push(line);
        continue;
      }
      if (/^```/.test(line)) { flushAll(); code = []; continue; }
      if (/^\s*\|.*\|\s*$/.test(line)) { flushPara(); flushList(); flushQuote(); table.push(line); continue; }
      flushTable();
      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) { flushAll(); out.push(React.createElement('h' + h[1].length, { key: key++ }, inline(h[2]))); continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flushAll(); out.push(<hr key={key++} />); continue; }
      if (/^>\s?/.test(line)) { flushPara(); flushList(); quote.push(line.replace(/^>\s?/, '')); continue; }
      const ul = line.match(/^\s*[-*]\s+(.*)$/);
      if (ul) { flushPara(); flushQuote(); if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; } list.items.push(ul[1]); continue; }
      const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (ol) { flushPara(); flushQuote(); if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; } list.items.push(ol[1]); continue; }
      if (!line.trim()) { flushAll(); continue; }
      flushList(); flushQuote();
      para.push(line);
    }
    if (code) out.push(<pre key={key++}><code>{code.join('\n')}</code></pre>);
    flushAll();
    return out;
  }, [md, ctx]);

  return <div className="panel-md">{blocks}</div>;
}
