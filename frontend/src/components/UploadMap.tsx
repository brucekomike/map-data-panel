import { useState } from 'react'
import { createMap } from '../api'

interface Props {
  projectId: number
  onClose: () => void
  onSuccess: () => void
}

export function UploadMap({ projectId, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('description', description)
      if (file) fd.append('file', file)
      await createMap(projectId, fd)
      onSuccess()
    } catch (err) {
      setError(String(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-96 border border-slate-600">
        <h2 className="text-lg font-bold text-white mb-4">Upload Map</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name *</label>
            <input
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Map name"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <input
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">3DGS File (.ply, .splat, .ksplat)</label>
            <input
              type="file"
              accept=".ply,.splat,.ksplat"
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 text-sm"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 rounded font-medium"
            >{uploading ? 'Uploading...' : 'Upload'}</button>
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
