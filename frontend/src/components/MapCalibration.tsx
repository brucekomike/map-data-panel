import { useState } from 'react'
import type { Map } from '../types'
import { updateMap } from '../api'

interface Props {
  map: Map
  onClose: () => void
  onUpdate: (map: Map) => void
}

export function MapCalibration({ map, onClose, onUpdate }: Props) {
  const [values, setValues] = useState({
    calibration_pos_x: map.calibration_pos_x,
    calibration_pos_y: map.calibration_pos_y,
    calibration_pos_z: map.calibration_pos_z,
    calibration_rot_x: map.calibration_rot_x,
    calibration_rot_y: map.calibration_rot_y,
    calibration_rot_z: map.calibration_rot_z,
    calibration_scale: map.calibration_scale,
  })
  const [saving, setSaving] = useState(false)

  const field = (key: keyof typeof values, label: string, min: number, max: number, step: number) => (
    <div className="flex items-center gap-3">
      <label className="text-sm text-slate-300 w-24 shrink-0">{label}</label>
      <input
        type="range"
        min={min} max={max} step={step}
        value={values[key]}
        onChange={e => setValues(v => ({ ...v, [key]: parseFloat(e.target.value) }))}
        className="flex-1"
      />
      <input
        type="number"
        step={step}
        value={values[key]}
        onChange={e => setValues(v => ({ ...v, [key]: parseFloat(e.target.value) || 0 }))}
        className="w-20 bg-slate-700 text-white text-sm px-2 py-1 rounded border border-slate-600 focus:outline-none"
      />
    </div>
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateMap(map.id, values)
      onUpdate(updated)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-[480px] border border-slate-600">
        <h2 className="text-lg font-bold text-white mb-4">Map Calibration: {map.name}</h2>
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Position Offset</div>
          {field('calibration_pos_x', 'Position X', -100, 100, 0.1)}
          {field('calibration_pos_y', 'Position Y', -100, 100, 0.1)}
          {field('calibration_pos_z', 'Position Z', -100, 100, 0.1)}
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Rotation</div>
          {field('calibration_rot_x', 'Rotation X', -180, 180, 1)}
          {field('calibration_rot_y', 'Rotation Y', -180, 180, 1)}
          {field('calibration_rot_z', 'Rotation Z', -180, 180, 1)}
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Scale</div>
          {field('calibration_scale', 'Scale', 0.01, 10, 0.01)}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium">
            {saving ? 'Saving...' : 'Save Calibration'}
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
  )
}
