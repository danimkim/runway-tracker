'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ReceiptUploadProps {
  transactionId: string;
  userId: string;
  currentReceiptUrl: string | null;
}

export function ReceiptUpload({ transactionId, userId, currentReceiptUrl }: ReceiptUploadProps) {
  const [receiptPath, setReceiptPath] = useState(currentReceiptUrl);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const supabase = createClient();

  useEffect(() => {
    if (!receiptPath) {
      setSignedUrl(null);
      return;
    }
    supabase.storage
      .from('receipts')
      .createSignedUrl(receiptPath, 3600)
      .then(({ data }) => {
        if (data) setSignedUrl(data.signedUrl);
      });
  }, [receiptPath]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, WebP, and HEIC files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadError('File size must be 5MB or less.');
      e.target.value = '';
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${transactionId}.${ext}`;
      const { error } = await supabase.storage.from('receipts').upload(path, file, { upsert: true });
      if (error) throw error;
      await supabase.from('transactions').update({ receipt_url: path }).eq('id', transactionId);
      setReceiptPath(path);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete() {
    if (!receiptPath) return;
    try {
      await supabase.storage.from('receipts').remove([receiptPath]);
      await supabase.from('transactions').update({ receipt_url: null }).eq('id', transactionId);
      setReceiptPath(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
    setDeleteConfirmOpen(false);
  }

  return (
    <div className="bg-white rounded-item p-4 shadow-(--shadow-card)">
      <p className="text-[13px] font-semibold text-secondary mb-2.5">Receipt</p>

      {signedUrl && (
        <div className="relative mb-3">
          <img
            src={signedUrl}
            alt="Receipt"
            className="w-full max-h-64 object-cover rounded-lg cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          />
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-[13px] font-medium text-secondary flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : '📎 Upload Receipt'}
      </button>
      {uploadError && <p className="text-[12px] text-red-500 mt-2 text-center">{uploadError}</p>}

      {lightboxOpen && signedUrl && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-bold"
          >
            ✕
          </button>
          <img
            src={signedUrl}
            alt="Receipt"
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-[280px] shadow-lg">
            <p className="text-[15px] font-semibold text-primary mb-1.5">Delete Receipt</p>
            <p className="text-[13px] text-secondary mb-5">Are you sure you want to delete this receipt?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-gray-100 text-[13px] font-semibold text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-[13px] font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
