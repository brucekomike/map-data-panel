import { useState } from 'react'
import type { Project, Map } from '../types'
import { createProject, deleteProject, deleteMap } from '../api'
import { UploadMap } from './UploadMap'

interface Props {
  projects: Project[]
  maps: Map[]
  selectedProject: Project | null
  selectedMap: Map | null
  onSelectProject: (p: Project) => void
  onSelectMap: (m: Map) => void
  onProjectsChange: () => void
  onMapsChange: () => void
}

export function ProjectsSidebar({ projects, maps, selectedProject, selectedMap, onSelectProject, onSelectMap, onProjectsChange, onMapsChange }: Props) {
  const [newProjectName, setNewProjectName] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set())

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    await createProject({ name: newProjectName.trim() })
    setNewProjectName('')
    setShowNewProject(false)
    onProjectsChange()
  }

  const handleDeleteProject = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Delete this project and all its maps?')) return
    await deleteProject(id)
    onProjectsChange()
  }

  const handleDeleteMap = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Delete this map?')) return
    await deleteMap(id)
    onMapsChange()
  }

  const toggleExpand = (id: number) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white">Map Data Panel</h1>
        <p className="text-xs text-slate-400">3DGS Monitor</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</span>
          <button
            onClick={() => setShowNewProject(v => !v)}
            className="text-slate-400 hover:text-white text-lg leading-none"
            title="New project"
          >+</button>
        </div>

        {showNewProject && (
          <div className="mb-2 px-2">
            <input
              className="w-full bg-slate-800 text-white text-sm px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="Project name"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
            <div className="flex gap-1 mt-1">
              <button onClick={handleCreateProject} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded">Create</button>
              <button onClick={() => setShowNewProject(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 rounded">Cancel</button>
            </div>
          </div>
        )}

        {projects.map(project => (
          <div key={project.id} className="mb-1">
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${selectedProject?.id === project.id ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
              onClick={() => { onSelectProject(project); toggleExpand(project.id) }}
            >
              <span className="text-slate-400 text-xs">{expandedProjects.has(project.id) ? '▼' : '▶'}</span>
              <span className="flex-1 text-sm text-white truncate">{project.name}</span>
              <button
                onClick={(e) => handleDeleteProject(e, project.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs"
              >✕</button>
            </div>

            {expandedProjects.has(project.id) && selectedProject?.id === project.id && (
              <div className="ml-4">
                {maps.map(map => (
                  <div
                    key={map.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${selectedMap?.id === map.id ? 'bg-blue-900' : 'hover:bg-slate-800'}`}
                    onClick={() => onSelectMap(map)}
                  >
                    <span className="text-slate-400 text-xs">🗺</span>
                    <span className="flex-1 text-sm text-slate-300 truncate">{map.name}</span>
                    <span className="text-xs text-slate-500">{map.file_type || ''}</span>
                    <button
                      onClick={(e) => handleDeleteMap(e, map.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs"
                    >✕</button>
                  </div>
                ))}
                <button
                  onClick={() => setShowUpload(true)}
                  className="w-full text-left px-2 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded"
                >+ Upload Map</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showUpload && selectedProject && (
        <UploadMap
          projectId={selectedProject.id}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); onMapsChange() }}
        />
      )}
    </div>
  )
}
