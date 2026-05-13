import { ConfirmContent } from '@/features/auth/components/ConfirmContent';

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = '' } = await searchParams;
  return <ConfirmContent email={email} />;
}
