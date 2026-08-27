export const MAX_RECEIPT_SIZE = 10 * 1024 * 1024;
export const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const RECEIPT_ACCEPT = ALLOWED_RECEIPT_TYPES.join(',');

type ReceiptStorageClient = {
  storage: {
    from: (bucket: 'receipts') => {
      upload: (path: string, file: File, options?: { upsert?: boolean }) => Promise<{ error: unknown }>;
    };
  };
};

export function getReceiptFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

export function validateReceiptImage(file: File) {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, WebP, and HEIC files are allowed.';
  }

  if (file.size > MAX_RECEIPT_SIZE) {
    return 'Receipt image must be 10MB or less.';
  }

  return null;
}

export function buildReceiptPath(userId: string, file: File, id = crypto.randomUUID()) {
  const ext = file.name.split('.').pop()?.toLowerCase() || file.type.split('/').pop() || 'jpg';
  return `${userId}/${id}.${ext}`;
}

export async function uploadReceiptImage(
  supabase: ReceiptStorageClient,
  {
    file,
    userId,
    id,
    upsert,
  }: {
    file: File;
    userId: string;
    id?: string;
    upsert?: boolean;
  },
) {
  const validationError = validateReceiptImage(file);
  if (validationError) return { path: null, error: validationError };

  const path = buildReceiptPath(userId, file, id);
  const { error } = await supabase.storage.from('receipts').upload(path, file, { upsert });

  if (error) return { path: null, error: 'Failed to upload receipt image.' };

  return { path, error: null };
}
