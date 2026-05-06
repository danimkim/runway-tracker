'use client';

import { useRef, useState } from 'react';

type State = 'idle' | 'uploading' | 'success' | 'error';

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
    setResult(null);

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

  return (
    <div className="flex flex-col gap-3.5">
      {/* Drop zone */}
      <div
        className={`bg-card rounded-card shadow-card p-6 flex flex-col items-center gap-3 transition-colors ${dragging ? 'bg-surface' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="w-12 h-12 rounded-item bg-surface flex items-center justify-center text-2xl">📄</div>
        <div className="text-center">
          <p className="text-sm font-semibold text-primary">TossBank Card Statement</p>
          <p className="text-[13px] text-muted mt-1">
            Export from TossBank app → Foreign account → Transaction history
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
            <p className="text-sm font-semibold text-primary">Upload complete</p>
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
              onClick={() => {
                setState('idle');
                setErrorMsg(null);
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
