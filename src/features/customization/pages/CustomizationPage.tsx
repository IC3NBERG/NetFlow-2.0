import { motion, Reorder } from 'framer-motion'
import { useState } from 'react'
import { useCustomizationStore } from '../../../lib/stores/customization'
import { useTheme } from '../../../app/providers/ThemeProvider'
import { GlassCard } from '../../../shared/ui/GlassCard'
import { Button } from '../../../shared/ui/Button'
import { Toast } from '../../../shared/ui/Toast'
import {
  Sun,
  Moon,
  Monitor,
  LayoutDashboard,
  Briefcase,
  Users,
  FileSpreadsheet,
  FileText,
  Receipt,
  CalendarDays,
  Archive,
  ArrowUp,
  ArrowDown,
  GripVertical,
  RotateCcw,
  Sliders,
} from 'lucide-react'
import { type Theme } from '../../../types/database'

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Chiaro', icon: Sun },
  { value: 'dark', label: 'Scuro', icon: Moon },
]

const navItemsMeta = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Lavori' },
  { to: '/clients', icon: Users, label: 'Clienti' },
  { to: '/quotes', icon: FileSpreadsheet, label: 'Preventivi' },
  { to: '/invoicing', icon: FileText, label: 'Fatture' },
  { to: '/expenses', icon: Receipt, label: 'Uscite' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/ledger', icon: Archive, label: 'Registro' },
]

export function CustomizationPage() {
  const { theme, setTheme } = useTheme()
  const {
    sidebarOrder,
    brandColor,
    successColor,
    expenseColor,
    setSidebarOrder,
    setColors,
    resetColors,
  } = useCustomizationStore()

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Reorder items by current sidebarOrder
  const items = [...sidebarOrder]
    .map((path) => navItemsMeta.find((meta) => meta.to === path))
    .filter(Boolean) as typeof navItemsMeta

  function handleMove(index: number, direction: 'up' | 'down') {
    const newItems = [...sidebarOrder]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newItems.length) return

    const currentItem = newItems[index]
    const targetItem = newItems[targetIndex]
    if (currentItem !== undefined && targetItem !== undefined) {
      newItems[index] = targetItem
      newItems[targetIndex] = currentItem
      setSidebarOrder(newItems)
    }
  }

  function handleReorder(newOrderPaths: string[]) {
    // Make sure we don't accidentally remove items
    const validatedOrder = newOrderPaths.filter((path) =>
      navItemsMeta.some((meta) => meta.to === path)
    )
    setSidebarOrder(validatedOrder)
  }

  function handleColorChange(key: 'brandColor' | 'successColor' | 'expenseColor', value: string) {
    setColors({ [key]: value })
  }

  function handleReset() {
    resetColors()
    setToast({ message: 'Colori ripristinati ai valori predefiniti', type: 'success' })
  }

  const containerAnim = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold">
          Personalizzazione
        </h2>
        <p className="text-xs md:text-sm text-text-secondary">
          Gestisci il tema grafico, i colori principali dell'app e l'ordine dei menu di navigazione
        </p>
      </div>

      <motion.div variants={containerAnim} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: Theme and Colors */}
        <div className="space-y-6">
          {/* THEME SELECTOR CARD */}
          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Sun className="h-5 w-5 text-brand" />
                <h3 className="text-base md:text-lg font-semibold">Tema dell'applicazione</h3>
              </div>
              <p className="text-xs md:text-sm text-text-secondary">
                Scegli se utilizzare il tema chiaro, scuro o seguire le impostazioni del tuo dispositivo.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {themes.map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`flex items-center justify-center gap-2 rounded-card border px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-all duration-200 ${
                        theme === t.value
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-border bg-surface text-text-secondary hover:border-brand/50'
                      }`}
                    >
                      <Icon className="h-3.5 md:h-4 w-3.5 md:w-4" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </GlassCard>
          </motion.div>

          {/* COLOR PICKERS CARD */}
          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Sliders className="h-5 w-5 text-brand" />
                <h3 className="text-base md:text-lg font-semibold">Tavolozza Colori</h3>
              </div>
              <p className="text-xs md:text-sm text-text-secondary">
                Personalizza i colori primari del sito. I cambiamenti verranno applicati all'intera interfaccia istantaneamente.
              </p>

              <div className="space-y-4">
                {/* Brand Color */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-surface/30">
                  <div>
                    <label className="text-sm font-medium block text-text-primary">Colore principale (Brand)</label>
                    <span className="text-xs text-text-secondary/70">Pulsanti, selezione attiva, bordi evidenziati</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-text-secondary">{brandColor.toUpperCase()}</span>
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => handleColorChange('brandColor', e.target.value)}
                      className="w-10 h-10 border border-border/50 rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                {/* Success Color */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-surface/30">
                  <div>
                    <label className="text-sm font-medium block text-text-primary">Colore entrate (Success)</label>
                    <span className="text-xs text-text-secondary/70">Valori positivi, stato "pagata" o attivo</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-text-secondary">{successColor.toUpperCase()}</span>
                    <input
                      type="color"
                      value={successColor}
                      onChange={(e) => handleColorChange('successColor', e.target.value)}
                      className="w-10 h-10 border border-border/50 rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                {/* Expense Color */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-surface/30">
                  <div>
                    <label className="text-sm font-medium block text-text-primary">Colore uscite (Expense)</label>
                    <span className="text-xs text-text-secondary/70">Valori negativi, eliminazioni, messaggi di errore</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-text-secondary">{expenseColor.toUpperCase()}</span>
                    <input
                      type="color"
                      value={expenseColor}
                      onChange={(e) => handleColorChange('expenseColor', e.target.value)}
                      className="w-10 h-10 border border-border/50 rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/30">
                <Button variant="secondary" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Ripristina colori predefiniti
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Sidebar Reordering */}
        <div className="space-y-6">
          <motion.div variants={itemAnim}>
            <GlassCard className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5 text-brand" />
                <h3 className="text-base md:text-lg font-semibold">Ordinamento Sidebar</h3>
              </div>
              <p className="text-xs md:text-sm text-text-secondary">
                Trascina le voci di menu per riordinarle liberamente oppure usa le frecce laterali. L'ordine si aggiorna all'istante anche sulla barra inferiore mobile.
              </p>

              <Reorder.Group
                axis="y"
                values={sidebarOrder}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {items.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <Reorder.Item
                      key={item.to}
                      value={item.to}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 bg-surface/50 hover:bg-surface/80 transition-colors shadow-sm cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-text-secondary/40 shrink-0" />
                        <span className="p-2 bg-brand/10 text-brand rounded-lg shrink-0">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMove(index, 'up')
                          }}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg hover:bg-text-secondary/10 disabled:opacity-30 text-text-secondary transition-colors"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMove(index, 'down')
                          }}
                          disabled={index === items.length - 1}
                          className="p-1.5 rounded-lg hover:bg-text-secondary/10 disabled:opacity-30 text-text-secondary transition-colors"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </Reorder.Item>
                  )
                })}
              </Reorder.Group>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
