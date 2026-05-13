export function RunwayLogo({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="12" fill="#3B424E" />
      <path d="M20 8L20 32" stroke="#B0B9D3" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14L20 8L28 14" stroke="#B0B9D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 26L20 22L32 26" stroke="#AAB5C5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 31L20 28L34 31" stroke="#8991B2" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
