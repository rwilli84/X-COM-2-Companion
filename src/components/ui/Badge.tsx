import type { HTMLAttributes } from 'react'

type BadgeVariant = 'amber' | 'red' | 'green' | 'blue' | 'gray' | 'purple'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  amber:  'bg-amber-500/10  text-amber-400  border-amber-500/25',
  red:    'bg-red-500/10    text-red-400    border-red-500/25',
  green:  'bg-green-500/10  text-green-500  border-green-500/20',
  blue:   'bg-blue-500/10   text-blue-400   border-blue-500/20',
  gray:   'bg-white/5       text-neutral-400 border-white/10',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export function Badge({ variant = 'gray', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border rounded-sm ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
