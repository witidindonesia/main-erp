import { afterEach, describe, expect, it, vi } from 'vitest';
import Quill from 'quill-next';

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

function editor() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return new Quill(host, { theme: 'snow', modules: { toolbar: false } });
}

describe('rich text export security', () => {
  it('exports formula payloads as text rather than executable markup', () => {
    vi.stubGlobal('katex', { render: (value: string, node: HTMLElement) => { node.textContent = value; } });
    const quill = editor();
    const payload = '</span><img src=x onerror=alert(1)>';
    quill.setContents([{ insert: { formula: payload } }, { insert: '\n' }]);
    const result = document.createElement('div');
    result.innerHTML = quill.getSemanticHTML();
    expect(result.querySelector('img')).toBeNull();
    expect(result.textContent).toContain(payload);
  });

  it('keeps video URLs inside the href attribute when exporting', () => {
    const quill = editor();
    const payload = 'https://example.com/" onmouseover="alert(1)';
    quill.setContents([{ insert: { video: payload } }]);
    const result = document.createElement('div');
    result.innerHTML = quill.getSemanticHTML();
    expect(result.querySelector('[onmouseover]')).toBeNull();
    expect(result.querySelector('a')?.getAttribute('href')).toBe(payload);
    expect(result.textContent).toBe(payload);
  });

  it('preserves existing heading, bold, list and link content across HTML edits', () => {
    const quill = editor();
    quill.clipboard.dangerouslyPasteHTML('<h2>Pengumuman</h2><p><strong>Penting</strong> <a href="https://example.com">tautan</a></p><ul><li>Jadwal</li></ul>');
    expect(quill.root.querySelector('h2')?.textContent).toBe('Pengumuman');
    expect(quill.root.querySelector('strong')?.textContent).toBe('Penting');
    expect(quill.root.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
    expect(quill.root.querySelector('li')?.textContent).toBe('Jadwal');
    quill.insertText(0, 'Baru ');
    expect(quill.getText()).toContain('Baru Pengumuman');
    quill.setText('');
    expect(quill.getText().trim()).toBe('');
  });
});
