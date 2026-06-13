import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className = '', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-mono font-semibold uppercase tracking-wider transition-all focus:outline-none active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none'
    const sizes = {
      sm: 'px-3 py-1.5 text-xs min-h-[34px]',
      md: 'px-4 py-2.5 text-xs min-h-[42px]',
      lg: 'px-6 py-3 text-sm min-h-[50px]',
    }
    const variants = {
      primary:   'bg-amber-500 text-neutral-950 hover:bg-amber-400',
      secondary: 'bg-transparent text-neutral-300 border border-neutral-700 hover:border-neutral-500 hover:text-neutral-100',
      danger:    'bg-transparent text-red-400 border border-red-900 hover:border-red-700 hover:text-red-300',
      ghost:     'text-amber-500 hover:text-amber-300 hover:bg-white/5',
    }
    return (
      <button
        ref={ref}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
