import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Quill from 'quill-next';
import { RichTextEditor } from './RichTextEditor';

afterEach(cleanup);

it('loads existing HTML and toolbar, emits edits and empty content through the current callback', async () => {
  const original = vi.fn();
  const updated = vi.fn();
  const view = render(<RichTextEditor value="<h2>Pengumuman</h2><p><strong>Penting</strong></p>" onChange={original} />);
  await waitFor(() => expect(view.container.querySelector('.ql-editor h2')?.textContent).toBe('Pengumuman'));
  expect(view.container.querySelector('.ql-bold')).not.toBeNull();
  expect(view.container.querySelector('.ql-link')).not.toBeNull();
  expect(view.container.querySelector('.ql-editor strong')?.textContent).toBe('Penting');
  const host = view.container.querySelector('.ql-container')!;
  const quill = Quill.find(host) as Quill;
  quill.insertText(0, 'Baru ');
  expect(original).toHaveBeenLastCalledWith(expect.stringContaining('Baru Pengumuman'));
  view.rerender(<RichTextEditor value="" onChange={updated} />);
  quill.setText('');
  expect(updated).toHaveBeenLastCalledWith('');
  expect(original).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(view.container.innerHTML).toBe('');
});
