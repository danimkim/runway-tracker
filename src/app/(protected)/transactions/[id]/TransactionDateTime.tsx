'use client';

import { useSyncExternalStore } from 'react';

interface TransactionDateTimeProps {
  value: string | null;
}

const subscribe = () => () => {};

function formatDateTime(value: string | null) {
  if (!value) return '';

  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TransactionDateTime({ value }: TransactionDateTimeProps) {
  const formatted = useSyncExternalStore(
    subscribe,
    () => formatDateTime(value),
    () => '',
  );

  return <time dateTime={value ?? undefined}>{formatted}</time>;
}
