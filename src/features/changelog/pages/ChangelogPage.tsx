import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { marked } from 'marked'
import changelogRaw from '../../../../.spec/CHANGELOG.md?raw'

export function ChangelogPage() {
  const html = useMemo(() => {
    marked.setOptions({ async: false })
    return marked.parse(changelogRaw) as string
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold">Changelog</h2>
        <p className="text-xs md:text-sm text-text-secondary">
          Storico di tutte le versioni e modifiche dell'applicazione
        </p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemAnim}>
          <GlassCard className="p-4 md:p-6">
            <div
              className="changelog-content max-w-none text-text-secondary
                [&_h2]:text-lg [&_h2]:md:text-xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:first:mt-0
                [&_h3]:text-sm [&_h3]:md:text-base [&_h3]:font-semibold [&_h3]:text-brand [&_h3]:mb-2
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
                [&_li]:text-xs [&_li]:md:text-sm [&_li]:leading-relaxed
                [&_strong]:font-semibold [&_strong]:text-text-primary
                [&_code]:rounded [&_code]:bg-surface-alt [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono [&_code]:text-brand
                [&_hr]:border-border [&_hr]:my-6
                [&_p]:text-xs [&_p]:md:text-sm [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  )
}
