import { Line } from 'react-chartjs-2'
import 'chart.js/auto'

export default function SiloChart({ data, unit }) {
  const points = Array.isArray(data) ? data : []
  const labels = points.map((p) => p?.t ?? '')
  const values = points.map((p) => p?.v ?? 0)

  const chartData = {
    labels,
    datasets: [
      {
        label: unit ?? '',
        data: values,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.18)',
        borderWidth: 1.5,
        fill: true,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0a0a0a',
        borderColor: '#1f2937',
        borderWidth: 1,
        titleColor: '#e5e7eb',
        bodyColor: '#9ca3af',
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} ${unit ?? ''}`.trim(),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 0, autoSkipPadding: 16 },
        grid: { color: '#1f2937' },
        border: { display: false },
      },
      y: {
        ticks: { color: '#6b7280', font: { size: 10 } },
        grid: { color: '#1f2937' },
        border: { display: false },
      },
    },
  }

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
