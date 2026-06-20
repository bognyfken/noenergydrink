// Мотив приложения: банка энергетика, перечёркнутая (символ отказа).

interface Props {
  className?: string
}

export default function CanMark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="без энергетика"
    >
      {/* банка */}
      <rect x="16" y="10" width="16" height="28" rx="3" fill="#cdb4f6" opacity="0.9" />
      <rect x="16" y="10" width="16" height="6" rx="3" fill="#a78bda" />
      <rect x="20" y="6" width="8" height="5" rx="1.5" fill="#7c5cbf" />
      {/* «молния» на банке */}
      <path d="M25 18l-4 7h3l-2 6 6-8h-3l2-5z" fill="#7c5cbf" />
      {/* перечёркивание */}
      <line
        x1="9"
        y1="40"
        x2="39"
        y2="9"
        stroke="#c46b8a"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
