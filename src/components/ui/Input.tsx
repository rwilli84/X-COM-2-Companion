import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'

const baseClass = 'w-full font-mono text-sm rounded-[2px] px-3 focus:outline-none placeholder:text-neutral-600 transition-colors' +
  ' [background:var(--surface2)] [border:1px_solid_var(--border2)] [color:var(--text)] focus:[border-color:#f59e0b]'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`${baseClass} h-11 ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${baseClass} py-2.5 resize-none ${className}`}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <select
      ref={ref}
      className={`${baseClass} h-11 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select'
