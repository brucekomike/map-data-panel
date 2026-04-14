import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { ProjectsSidebar } from './components/ProjectsSidebar'
import { MapViewer } from './components/MapViewer'
import { WidgetPanel } from './components/WidgetPanel'
import { useWebSocket } from './hooks/useWebSocket'
import type { Project, Map, Widget, DataEntry } from './types'
import { getProjects, getMaps, getWidgets, getWidgetData } from './api'

export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [maps, setMaps] = useState<Map[]>([])
  const [selectedMap, setSelectedMap] = useState<Map | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null)
  const [widgetData, setWidgetData] = useState<DataEntry[]>([])
  const [widgetLatest, setWidgetLatest] = useState<Record<number, DataEntry>>({})

  const loadProjects = useCallback(async () => {
    const data = await getProjects()
    setProjects(data)
  }, [])

  const loadMaps = useCallback(async (projectId: number) => {
    const data = await getMaps(projectId)
    setMaps(data)
  }, [])

  const loadWidgets = useCallback(async (mapId: number) => {
    const data = await getWidgets(mapId)
    setWidgets(data)
  }, [])

  const loadWidgetData = useCallback(async (widgetId: number) => {
    const data = await getWidgetData(widgetId)
    setWidgetData(data)
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  useEffect(() => {
    if (selectedProject) loadMaps(selectedProject.id)
    else setMaps([])
  }, [selectedProject, loadMaps])

  useEffect(() => {
    if (selectedMap) loadWidgets(selectedMap.id)
    else setWidgets([])
  }, [selectedMap, loadWidgets])

  useEffect(() => {
    if (selectedWidget) loadWidgetData(selectedWidget.id)
    else setWidgetData([])
  }, [selectedWidget, loadWidgetData])

  const handleWsMessage = useCallback((msg: unknown) => {
    const m = msg as { type: string; widget_id: number; data: DataEntry }
    if (m.type === 'data_update') {
      setWidgetLatest(prev => ({ ...prev, [m.widget_id]: m.data }))
      if (selectedWidget?.id === m.widget_id) {
        setWidgetData(prev => [m.data, ...prev].slice(0, 100))
      }
    }
  }, [selectedWidget])

  useWebSocket(selectedMap?.id ?? null, handleWsMessage)

  const handleMapUpdate = useCallback((updated: Map) => {
    setSelectedMap(updated)
    setMaps(prev => prev.map(m => m.id === updated.id ? updated : m))
  }, [])

  const handleWidgetCreate = useCallback((w: Widget) => {
    setWidgets(prev => [...prev, w])
    setSelectedWidget(w)
  }, [])

  const handleWidgetDelete = useCallback((id: number) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
    if (selectedWidget?.id === id) setSelectedWidget(null)
  }, [selectedWidget])

  return (
    <div className="app-layout">
      <ProjectsSidebar
        projects={projects}
        maps={maps}
        selectedProject={selectedProject}
        selectedMap={selectedMap}
        onSelectProject={(p) => { setSelectedProject(p); setSelectedMap(null) }}
        onSelectMap={setSelectedMap}
        onProjectsChange={loadProjects}
        onMapsChange={() => selectedProject && loadMaps(selectedProject.id)}
      />
      <div className="flex-1 flex overflow-hidden">
        {selectedMap ? (
          <MapViewer
            map={selectedMap}
            widgets={widgets}
            widgetLatest={widgetLatest}
            selectedWidget={selectedWidget}
            onSelectWidget={setSelectedWidget}
            onWidgetCreate={handleWidgetCreate}
            onMapUpdate={handleMapUpdate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <div className="text-xl">Select a map to get started</div>
            </div>
          </div>
        )}
        {selectedWidget && (
          <WidgetPanel
            widget={selectedWidget}
            data={widgetData}
            onClose={() => setSelectedWidget(null)}
            onDelete={handleWidgetDelete}
            onUpdate={(w) => setWidgets(prev => prev.map(x => x.id === w.id ? w : x))}
          />
        )}
      </div>
    </div>
  )
}
