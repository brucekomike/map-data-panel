import type { Widget, DataEntry } from '../types'

interface Props {
  widget: Widget
  latestData?: DataEntry
  isSelected?: boolean
  onClick?: () => void
}

export function DataWidget({ widget, latestData, isSelected, onClick }: Props) {
  let displayValue = '—'
  if (latestData) {
    try {
      const parsed = JSON.parse(latestData.value)
      displayValue = typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : String(parsed)
    } catch {
      displayValue = latestData.value
    }
  }

  return (
    <div
      onClick={onClick}
      className={`bg-slate-800 border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white text-sm truncate">{widget.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">Key: {widget.data_key}</div>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${latestData ? 'bg-green-400' : 'bg-slate-600'}`} />
      </div>
      <div className="mt-2 text-sm font-mono text-green-400 bg-slate-900 rounded p-1.5 max-h-16 overflow-hidden text-ellipsis whitespace-nowrap">
        {displayValue}
      </div>
      {latestData && (
        <div className="text-xs text-slate-500 mt-1">
          {new Date(latestData.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  )
}
