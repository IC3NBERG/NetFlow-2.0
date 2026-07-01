import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import type { MonthlySummary } from '../../types/metrics'
import { getChartColors } from '../../lib/utils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, LineController, Title, Tooltip, Filler)

const crosshairPlugin = {
  id: 'crosshair',
  afterDraw(chart: ChartJS) {
    const active = (chart.tooltip as any)?._active
    if (!active || active.length === 0) return

    const ctx = chart.ctx
    const x = active[0].element.x as number
    const y = active[0].element.y as number

    ctx.save()
    ctx.setLineDash([4, 4])

    ctx.beginPath()
    ctx.strokeStyle = 'rgba(197, 150, 58, 0.2)'
    ctx.lineWidth = 1
    ctx.moveTo(x, chart.chartArea.top)
    ctx.lineTo(x, chart.chartArea.bottom)
    ctx.stroke()

    ctx.beginPath()
    ctx.strokeStyle = 'rgba(197, 150, 58, 0.1)'
    ctx.moveTo(chart.chartArea.left, y)
    ctx.lineTo(chart.chartArea.right, y)
    ctx.stroke()

    ctx.restore()
  },
}

interface AreaChartProps {
  data: MonthlySummary[]
}

export function AreaChart({ data }: AreaChartProps) {
  const colors = getChartColors()

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Saldo',
        data: data.map((d) => d.balance),
        borderColor: '#C5963A',
        backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } } }) => {
          if (!ctx.chart.chartArea) return '#C5963A20'
          const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          gradient.addColorStop(0, 'rgba(197, 150, 58, 0.35)')
          gradient.addColorStop(1, 'rgba(197, 150, 58, 0.01)')
          return gradient
        },
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#C5963A',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: 'Entrate',
        data: data.map((d) => d.income),
        borderColor: 'rgba(16, 185, 129, 0.4)',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#10B981',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 1.5,
        borderWidth: 1.5,
        borderDash: [5, 5],
      },
      {
        label: 'Uscite',
        data: data.map((d) => d.expenses),
        borderColor: 'rgba(227, 36, 0, 0.4)',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#E32400',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 1.5,
        borderWidth: 1.5,
        borderDash: [5, 5],
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: colors.textSecondary,
          usePointStyle: true,
          padding: 16,
          boxWidth: 10,
          font: { size: 11, family: 'Inter' },
        },
      },
      tooltip: {
        backgroundColor: colors.surface,
        titleColor: colors.textPrimary,
        titleFont: { size: 12, family: 'Inter', weight: 'bold' as const },
        bodyColor: colors.textSecondary,
        bodyFont: { size: 12, family: 'JetBrains Mono' },
        borderColor: 'rgba(197, 150, 58, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: true,
        boxPadding: 8,
        callbacks: {
          title(items: { label: string }[]) {
            const label = items[0]?.label
            if (!label) return ''
            const parts = label.split('-')
            if (parts.length !== 2) return label
            const m = parseInt(parts[1]!, 10) - 1
            const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
            return `${months[m] ?? ''} ${parts[0]!}`
          },
          label(ctx: { dataset: { label?: string }; parsed: { y: number | null } }) {
            const label = ctx.dataset.label ?? ''
            const value = ctx.parsed.y ?? 0
            const sign = value >= 0 ? '+' : ''
            const formatted = value.toLocaleString('it-IT', {
              style: 'currency',
              currency: 'EUR',
            })
            return `${label}: ${sign}${formatted}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: colors.textSecondary,
          maxTicksLimit: 6,
          font: { size: 10, family: 'Inter' },
          callback(value: string | number) {
            const parts = String(value).split('-')
            if (parts.length !== 2) return String(value)
            const m = parseInt(parts[1]!, 10) - 1
            const months = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D']
            return `${months[m] ?? ''} ${parts[0]!.slice(2)}`
          },
        },
      },
      y: {
        grid: { color: 'rgba(160, 160, 184, 0.08)' },
        ticks: {
          color: colors.textSecondary,
          font: { size: 10, family: 'JetBrains Mono' },
          maxTicksLimit: 5,
          callback(value: string | number) {
            const v = Number(value)
            if (Math.abs(v) >= 1000) {
              return `${(v / 1000).toFixed(0)}k €`
            }
            return `${v.toFixed(0)} €`
          },
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="h-48 md:h-56 lg:h-72 w-full">
      <Line data={chartData} options={options} plugins={[crosshairPlugin]} />
    </div>
  )
}
