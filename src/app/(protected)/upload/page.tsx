'use client';

import { useRouter } from 'next/navigation';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { StatementUpload } from '@/components/upload/StatementUpload';

export default function UploadPage() {
  const router = useRouter();

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Upload Statement" backHref="/transactions" />
      <div className="p-5 pb-24">
        <StatementUpload onSuccess={() => router.push('/transactions')} />
      </div>
    </div>
  );
}
