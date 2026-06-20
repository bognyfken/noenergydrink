import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/**
 * Нижний шит (bottom sheet). Рендерится через портал в document.body —
 * иначе на iOS Safari `position: fixed` внутри скролл-контейнера ведёт себя
 * как absolute и шит обрезается. Закрывается тапом по фону или свайпом вниз
 * за «хваталку» (drag только за неё, чтобы не мешать прокрутке содержимого).
 */
export default function Sheet({ open, onClose, title, children }: SheetProps) {
  const dragControls = useDragControls()

  return createPortal(
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
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] max-w-md flex-col rounded-t-[28px] border-t border-white/10 bg-surface px-5 pt-2 shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose()
            }}
          >
            {/* область захвата для свайпа вниз */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: 'none' }}
              className="-mx-5 flex shrink-0 cursor-grab justify-center py-2 active:cursor-grabbing"
            >
              <div className="h-1.5 w-11 rounded-full bg-white/20" />
            </div>
            {title && (
              <h2 className="mb-4 shrink-0 text-center text-lg font-bold text-text">{title}</h2>
            )}
            <div className="no-scrollbar overflow-y-auto overscroll-contain px-1">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
