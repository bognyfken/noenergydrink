import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/** Нижний шит (bottom sheet) с затемнением и пружинной анимацией. */
export default function Sheet({ open, onClose, title, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] max-w-md flex-col rounded-t-[28px] border-t border-white/10 bg-surface px-5 pt-3 shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-11 shrink-0 rounded-full bg-white/15" />
            {title && (
              <h2 className="mb-4 shrink-0 text-center text-lg font-bold text-text">{title}</h2>
            )}
            <div className="no-scrollbar overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
