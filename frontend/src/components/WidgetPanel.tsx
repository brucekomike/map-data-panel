import { useState } from 'react'
import type { Widget, DataEntry } from '../types'
import { deleteWidget, updateWidget } from '../api'

interface Props {
  widget: Widget
  data: DataEntry[]
  onClose: () => void
  onDelete: (id: number) => void
  onUpdate: (w: Widget) => void
}

export function WidgetPanel({ widget, data, onClose, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(widget.name)
  const [dataKey, setDataKey] = useState(widget.data_key)

  const handleDelete = async () => {
    if (!confirm('Delete this widget?')) return
    await deleteWidget(widget.id)
    onDelete(widget.id)
  }

  const handleSave = async () => {
    const updated = await updateWidget(widget.id, { name, data_key: dataKey })
    onUpdate(updated)
    setEditing(false)
  }

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        <div className="flex-1">
          {editing ? (
            <input
              className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          ) : (
            <h2 className="font-bold text-white">{widget.name}</h2>
          )}
        </div>
        <button onClick={() => setEditing(v => !v)} className="text-slate-400 hover:text-white text-sm">
          {editing ? '✕' : '✏️'}
        </button>
        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
      </div>

      <div className="p-4 space-y-3 border-b border-slate-700">
        <div className="text-xs text-slate-400 space-y-1">
          <div>Position: ({widget.pos_x.toFixed(2)}, {widget.pos_y.toFixed(2)}, {widget.pos_z.toFixed(2)})</div>
        </div>
        {editing ? (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data Key</label>
            <input
              className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm border border-slate-600 focus:outline-none"
              value={dataKey}
              onChange={e => setDataKey(e.target.value)}
            />
            <button onClick={handleSave} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-sm">Save</button>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Data key: <span className="text-slate-200">{widget.data_key}</span></div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data History</div>
        {data.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">No data received yet</div>
        ) : (
          <div className="space-y-2">
            {data.map(entry => {
              let display = entry.value
              try {
                const p = JSON.parse(entry.value)
                display = typeof p === 'object' ? JSON.stringify(p) : String(p)
              } catch { /* keep raw */ }
              return (
                <div key={entry.id} className="bg-slate-800 rounded p-2 border border-slate-700">
                  <div className="font-mono text-green-400 text-xs break-all">{display}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{new Date(entry.timestamp).toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700">
        <button onClick={handleDelete} className="w-full bg-red-900/50 hover:bg-red-800/70 text-red-400 py-2 rounded text-sm border border-red-800">
          Delete Widget
        </button>
      </div>
    </div>
  )
}
