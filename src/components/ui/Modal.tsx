import { type ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-t-xl sm:rounded-sm max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
          <span className="font-mono font-bold text-amber-400 uppercase tracking-widest text-sm">{title}</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-neutral-400">✕</Button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 border-t border-neutral-800 shrink-0 flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
