interface Segment {
  name: string
  value: number
}

interface DonutChartProps {
  segments: Segment[]
  colors: Record<string, string>
  size?: number
}

export function DonutChart({ segments, colors, size = 130 }: DonutChartProps) {
  const R = 46, cx = 65, cy = 65
  const C = 2 * Math.PI * R
  const total = segments.reduce((s, d) => s + d.value, 0)

  if (!total) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#EEF0F8' }}/>
  )

  return (
    <svg width={size} height={size} viewBox="0 0 130 130">
      {segments.map((seg, i) => {
        const previousValue = segments
          .slice(0, i)
          .reduce((sum, previous) => sum + previous.value, 0)
        const pct = seg.value / total
        const dash = pct * C
        const rotation = -90 + (previousValue / total) * 360
        return (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={colors[seg.name] || '#ccc'} strokeWidth="20"
            strokeDasharray={`${dash} ${C - dash}`}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            style={{ transition: 'all 0.4s ease' }}
          />
        )
      })}
      <circle cx={cx} cy={cy} r="34" fill="white"/>
    </svg>
  )
}
