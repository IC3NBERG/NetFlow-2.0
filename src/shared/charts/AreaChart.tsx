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

interface AreaChartProps {
  data: MonthlySummary[]
}

export function AreaChart({ data }: AreaChartProps) {
  const colors = getChartColors()

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Entrate',
        data: data.map((d) => d.income),
        borderColor: '#6C5CE7',
        backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } } }) => {
          if (!ctx.chart.chartArea) return '#6C5CE720'
          const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          gradient.addColorStop(0, 'rgba(108, 92, 231, 0.4)')
          gradient.addColorStop(1, 'rgba(108, 92, 231, 0.02)')
          return gradient
        },
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'Uscite',
        data: data.map((d) => d.expenses),
        borderColor: '#FF6B6B',
        backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } } }) => {
          if (!ctx.chart.chartArea) return '#FF6B6B20'
          const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom)
          gradient.addColorStop(0, 'rgba(255, 107, 107, 0.4)')
          gradient.addColorStop(1, 'rgba(255, 107, 107, 0.02)')
          return gradient
        },
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: colors.textSecondary, usePointStyle: true, padding: 16 },
      },
      tooltip: {
        backgroundColor: colors.surface,
        titleColor: colors.textPrimary,
        bodyColor: colors.textSecondary,
        borderColor: colors.brand,
        borderWidth: 1,
        cornerRadius: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: colors.textSecondary },
      },
      y: {
        grid: { color: colors.border },
        ticks: { color: colors.textSecondary },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="h-48 md:h-56 lg:h-72 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
