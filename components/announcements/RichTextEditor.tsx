'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  borderColor: string;
  background: string;
  textColor: string;
}

const buttonStyle: React.CSSProperties = {
  border: '1px solid var(--editor-border)',
  background: 'var(--editor-bg)',
  color: 'var(--editor-text)',
  borderRadius: 6,
  minWidth: 32,
  height: 32,
  padding: '0 8px',
  cursor: 'pointer',
  fontWeight: 650
};

export default function RichTextEditor({
  value, onChange, disabled = false, placeholder = 'Write your announcement...',
  borderColor, background, textColor
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  function runCommand(command: string, commandValue?: string) {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current.innerHTML);
  }

  function handleInput() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }


  return (
    <div style={{ border: `1px solid ${borderColor}`, borderRadius: 9, overflow: 'hidden', background }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: 8, borderBottom: `1px solid ${borderColor}` }}>
        <select aria-label="Font family" disabled={disabled} defaultValue="Arial" onChange={e => runCommand('fontName', e.target.value)} style={{ ...buttonStyle, maxWidth: 145 }}>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="Trebuchet MS">Trebuchet MS</option>
          <option value="Courier New">Courier New</option>
        </select>
        <select aria-label="Font size" disabled={disabled} defaultValue="3" onChange={e => runCommand('fontSize', e.target.value)} style={buttonStyle}>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">X-Large</option>
          <option value="6">XX-Large</option>
        </select>
        <button type="button" title="Bold" aria-label="Bold" disabled={disabled} onMouseDown={e => e.preventDefault()} onClick={() => runCommand('bold')} style={{ ...buttonStyle, fontWeight: 900 }}>B</button>
        <button type="button" title="Italic" aria-label="Italic" disabled={disabled} onMouseDown={e => e.preventDefault()} onClick={() => runCommand('italic')} style={{ ...buttonStyle, fontStyle: 'italic' }}>I</button>
        <button type="button" title="Underline" aria-label="Underline" disabled={disabled} onMouseDown={e => e.preventDefault()} onClick={() => runCommand('underline')} style={{ ...buttonStyle, textDecoration: 'underline' }}>U</button>
        <label title="Text color" style={{ ...buttonStyle, display: 'inline-flex', alignItems: 'center', gap: 5, cursor: disabled ? 'not-allowed' : 'pointer' }}>
          <span>A</span><input aria-label="Text color" type="color" disabled={disabled} defaultValue="#61259F" onChange={e => runCommand('foreColor', e.target.value)} style={{ width: 20, height: 20, padding: 0, border: 0, background: 'transparent' }} />
        </label>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Announcement content"
        data-placeholder={placeholder}
        onInput={handleInput}
        style={{
          minHeight: 190, maxHeight: 460, overflowY: 'auto', padding: '0.85rem',
          color: textColor, outline: 'none', lineHeight: 1.65, overflowWrap: 'anywhere'
        }}
      />
      <style jsx>{`
        [contenteditable="true"]:empty:before {
          content: attr(data-placeholder);
          color: ${textColor};
          opacity: .55;
          pointer-events: none;
        }
        [contenteditable] img { display: block; max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}

export function AnnouncementRichContent({ html }: { html: string }) {
  const [safeHtml, setSafeHtml] = useState('');

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '', 'text/html');
    const allowed = new Set(['P', 'DIV', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'SPAN', 'FONT', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'IMG', 'A']);
    const cleanNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
      if (!(node instanceof HTMLElement)) return null;
      if (!allowed.has(node.tagName)) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach(child => {
          const cleaned = cleanNode(child);
          if (cleaned) fragment.appendChild(cleaned);
        });
        return fragment;
      }
      const clean = document.createElement(node.tagName.toLowerCase());
      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src') || '';
        if (!src.startsWith('https://')) return null;
        clean.setAttribute('src', src);
        clean.setAttribute('alt', (node.getAttribute('alt') || 'Announcement image').slice(0, 200));
        clean.setAttribute('loading', 'lazy');
        clean.setAttribute('style', 'display:block;max-width:100%;height:auto;max-height:640px;object-fit:contain;margin:12px 0;border-radius:8px');
        return clean;
      }
      if (node.tagName === 'A') {
        const href = node.getAttribute('href') || '';
        if (!/^https:\/\//i.test(href)) return null;
        clean.setAttribute('href', href);
        clean.setAttribute('target', '_blank');
        clean.setAttribute('rel', 'noopener noreferrer');
      }
      if (node.tagName === 'SPAN' || node.tagName === 'FONT') {
        const color = node.style.color || node.getAttribute('color') || '';
        const fontFamily = node.style.fontFamily || node.getAttribute('face') || '';
        const fontSize = node.style.fontSize;
        const styles: string[] = [];
        if (/^#[0-9a-f]{3,8}$/i.test(color) || /^rgb\(/i.test(color)) styles.push(`color:${color}`);
        if (/^(Arial|Georgia|Times New Roman|Verdana|Trebuchet MS|Courier New)$/i.test(fontFamily.replaceAll('"', '').replaceAll("'", ''))) styles.push(`font-family:${fontFamily}`);
        if (/^(\d+(\.\d+)?(px|pt|em|rem|%))$/.test(fontSize)) styles.push(`font-size:${fontSize}`);
        if (styles.length) clean.setAttribute('style', styles.join(';'));
      }
      Array.from(node.childNodes).forEach(child => {
        const cleaned = cleanNode(child);
        if (cleaned) clean.appendChild(cleaned);
      });
      return clean;
    };
    const container = document.createElement('div');
    Array.from(doc.body.childNodes).forEach(node => {
      const cleaned = cleanNode(node);
      if (cleaned) container.appendChild(cleaned);
    });
    setSafeHtml(container.innerHTML);
  }, [html]);

  return <div style={{ lineHeight: 1.7, overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
