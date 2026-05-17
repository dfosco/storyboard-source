import {
  FileIcon,
  ImageIcon,
  ZapIcon,
  KeyIcon,
  GraphIcon,
  SyncIcon,
  CalendarIcon,
  PersonIcon,
  InfoIcon,
} from '@primer/octicons-react'
import { useFlowData, useObject } from '@dfosco/storyboard'
import SiloChart from '@/components/SiloChart/SiloChart.jsx'

const ICONS = {
  file: FileIcon,
  image: ImageIcon,
  zap: ZapIcon,
  key: KeyIcon,
}

function Pill({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 ${className}`}
    >
      {children}
    </span>
  )
}

function SummaryCard({ data }) {
  if (!data) return null
  const { label, percent, provisioned, quota, unit } = data
  const provPct = quota ? Math.min(100, (provisioned / quota) * 100) : 0
  const quotaPct = Math.max(0, 100 - provPct)
  const pctNum = Number(percent ?? 0)
  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm uppercase tracking-wider text-neutral-400">{label}</div>
        <div className="text-right text-3xl font-semibold text-neutral-100 tabular-nums">
          {pctNum.toFixed(2)}
          <span className="ml-1 text-base text-neutral-500">%</span>
        </div>
      </div>
      <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div className="h-full bg-emerald-500" style={{ width: `${provPct}%` }} />
        <div className="h-full bg-violet-500" style={{ width: `${quotaPct}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Provisioned <span className="text-neutral-200 tabular-nums">{provisioned}</span> {unit}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
          Quota <span className="text-neutral-200 tabular-nums">{quota}</span> {unit}
        </span>
      </div>
    </div>
  )
}

function ChartPanel({ title, data, unit }) {
  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-300">
          <span className="font-medium text-neutral-200">{title}</span>
          <InfoIcon size={12} className="text-neutral-500" />
        </div>
        <div className="text-xs text-neutral-500">{unit}</div>
      </div>
      <SiloChart data={data} unit={unit} />
    </div>
  )
}

function Select({ children }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-300 hover:border-neutral-700">
      {children}
      <span className="text-neutral-500">▾</span>
    </button>
  )
}

export default function SiloDashboard() {
  const summary = useFlowData('summary') ?? {}
  const user = useFlowData('user') ?? {}
  const workspace = useFlowData('workspace') ?? {}
  const nav = useFlowData('nav') ?? { sections: [] }
  const timeRange = useFlowData('timeRange') ?? {}

  const cpuSeries = useObject('metrics', 'cpu') ?? []
  const memSeries = useObject('metrics', 'memory') ?? []
  const storageSeries = useObject('metrics', 'storage') ?? []

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 font-mono text-neutral-200">
      {/* Sidebar */}
      <aside className="flex w-1/5 flex-col gap-4 border-r border-neutral-800 p-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-sm bg-emerald-400 text-neutral-950">
            <ZapIcon size={14} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-widest text-neutral-500">Silo</span>
            <span className="text-sm text-neutral-100">{workspace?.name ?? '—'}</span>
          </div>
        </div>

        <button className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-400 hover:border-neutral-700">
          <span>Jump to</span>
          <span className="rounded border border-neutral-800 bg-neutral-950 px-1.5 py-0.5 text-[10px] text-neutral-500">
            ⌘K
          </span>
        </button>

        {(nav?.sections ?? []).map((section, si) => (
          <div key={si} className="flex flex-col gap-1">
            <div className="px-1 text-[10px] uppercase tracking-widest text-neutral-500">
              {section?.title}
            </div>
            {(section?.items ?? []).map((item, ii) => {
              const Icon = ICONS[item?.icon] ?? FileIcon
              const active = !!item?.active
              return (
                <a
                  key={ii}
                  href="#"
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                    active
                      ? 'bg-neutral-900 text-emerald-400'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item?.label}</span>
                </a>
              )
            })}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col w-4/5 overflow-y-auto">
        <header className="flex min-h-16 items-center justify-between border-b border-neutral-800 px-5">
          <div className="flex items-center gap-3 text-sm text-neutral-300">
            <span className="text-neutral-500">/</span>
            <span>Utilization Rates</span>
          </div>
          <div className="flex items-center gap-2">
            <Pill>
              <span className="text-neutral-500">Silo</span>
              <span>{workspace?.silo ?? '—'}</span>
            </Pill>
            <Pill>
              <PersonIcon size={12} />
              <span>{user?.name ?? '—'}</span>
            </Pill>
          </div>
        </header>

        <div className="flex flex-col gap-5 px-8 py-6">
          {/* Title */}
          <div className="flex items-center gap-2.5">
            <GraphIcon size={20} className="text-emerald-400" />
            <h1 className="m-0 text-2xl font-semibold leading-none text-neutral-100">
              Utilization
            </h1>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard data={summary?.cpu} />
            <SummaryCard data={summary?.memory} />
            <SummaryCard data={summary?.storage} />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="grid h-8 w-8 place-items-center rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-100">
                <SyncIcon size={14} />
              </button>
              <Select>All projects</Select>
            </div>
            <div className="flex items-center gap-2">
              <Select>
                <CalendarIcon size={12} />
                {timeRange?.label ?? 'Last hour'}
              </Select>
              <span className="text-xs text-neutral-500 tabular-nums">
                {timeRange?.from ?? ''} <span className="text-neutral-700">→</span>{' '}
                {timeRange?.to ?? ''}
              </span>
            </div>
          </div>

          {/* Charts */}
          <div className="flex flex-col gap-3">
            <ChartPanel title="CPU" data={cpuSeries} unit="Count" />
            <ChartPanel title="Memory" data={memSeries} unit="GiB" />
            <ChartPanel title="Storage" data={storageSeries} unit="TiB" />
          </div>
        </div>
      </main>
    </div>
  )
}
