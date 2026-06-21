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

interface LineChartProps {
  data: MonthlySummary[]
  dataKey: 'income' | 'expenses' | 'balance'
  label: string
  color?: string
}

export function LineChart({ data, dataKey, label, color = '#6C5CE7' }: LineChartProps) {
  const colors = getChartColors()

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label,
        data: data.map((d) => d[dataKey]),
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
      },
    },
  }

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
