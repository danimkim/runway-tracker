'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface ReceiptUploadProps {
  transactionId: string
  userId: string
  currentReceiptUrl: string | null
  onUpload: (url: string) => void
}

export function ReceiptUpload({ transactionId, userId, currentReceiptUrl, onUpload }: ReceiptUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${transactionId}.${ext}`

      const { error } = await supabase.storage
        .from('receipts')
        .upload(path, file, { upsert: true })

      if (error) throw error

      await supabase
        .from('transactions')
        .update({ receipt_url: path })
        .eq('id', transactionId)

      onUpload(path)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleView() {
    if (!currentReceiptUrl) return
    const { data } = await supabase.storage
      .from('receipts')
      .createSignedUrl(currentReceiptUrl, 60)
    if (data) window.open(data.signedUrl, '_blank')
  }

  if (currentReceiptUrl) {
    return (
      <Button variant="ghost" size="sm" onClick={handleView} className="text-blue-500 p-0 h-auto">
        View receipt
      </Button>
    )
  }

  return (
    <label className="cursor-pointer">
      <span className="text-xs text-slate-400 hover:text-slate-600">
        {isUploading ? 'Uploading...' : 'Attach receipt'}
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </label>
  )
}
