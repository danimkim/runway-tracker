'use client';

import { useRef, useState } from 'react';
import type { TossBankTransaction } from '@/lib/tossbank/types';

type State = 'idle' | 'uploading' | 'preview' | 'saving' | 'success' | 'error';

interface UploadResult {
  inserted: number;
  skipped: number;
}

interface Props {
  onSuccess?: () => void;
}

export function StatementUpload({ onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>('idle');
  const [parsed, setParsed] = useState<TossBankTransaction[]>([]);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Please select a PDF file.');
      setState('error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('File must be under 20 MB.');
      setState('error');
      return;
    }

    setState('uploading');
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Upload failed.');
        setState('error');
        return;
      }

      setParsed(data.transactions ?? []);
      setState('preview');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  }

  async function handleConfirm() {
    setState('saving');
    try {
      const res = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: parsed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to save transactions.');
        setState('error');
        return;
      }

      setResult(data);
      setState('success');
      setTimeout(() => onSuccess?.(), 1500);
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function reset() {
    setState('idle');
    setParsed([]);
    setErrorMsg(null);
    setResult(null);
  }

  const isDropZoneActive = state === 'idle' || state === 'error';

  return (
    <div className="flex flex-col gap-3.5">
      {/* Drop zone — only shown when not in preview/saving/success */}
      {state !== 'preview' && state !== 'saving' && state !== 'success' && (
        <div
          className={`bg-card rounded-card shadow-card p-6 flex flex-col items-center gap-3 transition-colors ${dragging ? 'bg-surface' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (isDropZoneActive) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={isDropZoneActive ? handleDrop : (e) => e.preventDefault()}
        >
          <div className="w-12 h-12 rounded-item bg-surface flex items-center justify-center text-2xl">📄</div>
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">Bank Statement</p>
            <p className="text-[13px] text-muted mt-1">
              {state === 'uploading' ? 'Parsing PDF…' : 'Drag & drop or click to select'}
            </p>
          </div>
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleInputChange} />
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={state === 'uploading'}
            onClick={() => inputRef.current?.click()}
          >
            {state === 'uploading' ? 'Uploading…' : 'Select PDF'}
          </button>
        </div>
      )}

      {/* Preview */}
      {state === 'preview' && (
        <div className="bg-card rounded-card shadow-card overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <p className="text-sm font-semibold text-primary">
              {parsed.length} transaction{parsed.length !== 1 ? 's' : ''} found
            </p>
            <p className="text-[13px] text-muted mt-0.5">Review before importing</p>
          </div>
          <ul className="divide-y divide-border max-h-72 overflow-y-auto">
            {parsed.map((t) => (
              <li key={t.approval_no} className="flex items-center justify-between px-5 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-primary truncate">{t.merchant_name}</p>
                  <p className="text-[11px] text-muted">{t.transacted_at}</p>
                </div>
                <p className="text-[13px] font-semibold text-primary shrink-0">
                  {t.local_amount} {t.local_currency}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex gap-2.5 p-4">
            <button type="button" className="btn-secondary flex-1" onClick={reset}>
              Cancel
            </button>
            <button type="button" className="btn-primary flex-1" onClick={handleConfirm}>
              Import {parsed.length}
            </button>
          </div>
        </div>
      )}

      {/* Saving spinner */}
      {state === 'saving' && (
        <div className="bg-card rounded-card shadow-card p-6 flex flex-col items-center gap-3">
          <p className="text-sm text-muted">Saving transactions…</p>
        </div>
      )}

      {/* Success */}
      {state === 'success' && result && (
        <div
          className="rounded-item p-4 flex items-start gap-3"
          style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success)' }}
        >
          <span className="text-lg" style={{ color: 'var(--color-success)' }}>
            ✓
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Import complete</p>
            <p className="text-[13px] text-muted mt-0.5">
              {result.inserted} transactions added
              {result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && errorMsg && (
        <div
          className="rounded-item p-4 flex items-start gap-3"
          style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)' }}
        >
          <span className="text-lg" style={{ color: 'var(--color-warning)' }}>
            ⚠
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-warning-text)' }}>
              Upload failed
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-warning-text)' }}>
              {errorMsg}
            </p>
            <button
              type="button"
              className="text-[13px] font-medium mt-2 underline"
              style={{ color: 'var(--color-warning-text)' }}
              onClick={reset}
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
