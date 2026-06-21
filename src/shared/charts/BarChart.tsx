import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js'
import type { MonthlySummary } from '../../types/metrics'
import { getChartColors } from '../../lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, Title, Tooltip)

interface BarChartProps {
  data: MonthlySummary[]
}

export function BarChart({ data }: BarChartProps) {
  const colors = getChartColors()

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Carta',
        data: data.map((d) => d.card_income),
        backgroundColor: colors.brand,
        borderRadius: 8,
        barPercentage: 0.4,
      },
      {
        label: 'Cash',
        data: data.map((d) => d.cash_income),
        backgroundColor: colors.success,
        borderRadius: 8,
        barPercentage: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: colors.textSecondary, usePointStyle: true },
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
      },
    },
  }

  return (
    <div className="h-44 md:h-52 lg:h-64 w-full">
      <Bar data={chartData} options={options} />
    </div>
  )
}
