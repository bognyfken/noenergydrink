import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function MotivationCard({ text }: { text: string }) {
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-3 rounded-[var(--radius-soft)] border border-white/5 bg-gradient-to-br from-primary/25 to-lavender/10 p-4"
    >
      <Sparkles size={20} className="mt-0.5 shrink-0 text-lavender" />
      <p className="text-sm leading-relaxed text-text/90">{text}</p>
    </motion.div>
  )
}
