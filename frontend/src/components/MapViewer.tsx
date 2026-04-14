import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import type { Map, Widget, DataEntry } from '../types'
import { createWidget } from '../api'
import { MapCalibration } from './MapCalibration'
import { DataWidget } from './DataWidget'

interface Props {
  map: Map
  widgets: Widget[]
  widgetLatest: Record<number, DataEntry>
  selectedWidget: Widget | null
  onSelectWidget: (w: Widget) => void
  onWidgetCreate: (w: Widget) => void
  onMapUpdate: (m: Map) => void
}

export function MapViewer({ map, widgets, widgetLatest, selectedWidget, onSelectWidget, onWidgetCreate, onMapUpdate }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const frameRef = useRef<number>(0)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const cameraTheta = useRef(Math.PI / 4)
  const cameraPhi = useRef(Math.PI / 3)
  const cameraRadius = useRef(5)
  const cameraTarget = useRef(new THREE.Vector3(0, 0, 0))

  const [showCalibration, setShowCalibration] = useState(false)
  const [showCreateWidget, setShowCreateWidget] = useState(false)
  const [newWidgetPos, setNewWidgetPos] = useState({ x: 0, y: 0, z: 0 })
  const [newWidgetName, setNewWidgetName] = useState('')
  const [newWidgetKey, setNewWidgetKey] = useState('default')

  const widgetMarkersRef = useRef<THREE.Group>(new THREE.Group())

  useEffect(() => {
    if (!canvasRef.current) return
    const container = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1e293b)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 1000)
    cameraRef.current = camera

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)

    const grid = new THREE.GridHelper(20, 20, 0x334155, 0x1e3a5f)
    scene.add(grid)

    // Simulated 3DGS point cloud
    const geometry = new THREE.BufferGeometry()
    const count = 2000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4
      positions[i * 3 + 1] = Math.random() * 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      colors[i * 3] = 0.3 + Math.random() * 0.7
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.7
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.7
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    scene.add(widgetMarkersRef.current)

    const updateCamera = () => {
      const x = cameraRadius.current * Math.sin(cameraPhi.current) * Math.sin(cameraTheta.current)
      const y = cameraRadius.current * Math.cos(cameraPhi.current)
      const z = cameraRadius.current * Math.sin(cameraPhi.current) * Math.cos(cameraTheta.current)
      camera.position.set(
        cameraTarget.current.x + x,
        cameraTarget.current.y + y,
        cameraTarget.current.z + z
      )
      camera.lookAt(cameraTarget.current)
    }
    updateCamera()

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      updateCamera()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (!canvasRef.current) return
      const w = canvasRef.current.clientWidth
      const h = canvasRef.current.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [map.id])

  // Update widget markers
  useEffect(() => {
    const group = widgetMarkersRef.current
    while (group.children.length > 0) group.remove(group.children[0])

    widgets.forEach(w => {
      const geo = new THREE.SphereGeometry(0.08, 12, 12)
      const mat = new THREE.MeshStandardMaterial({
        color: selectedWidget?.id === w.id ? 0x3b82f6 : 0xf59e0b,
        emissive: selectedWidget?.id === w.id ? 0x1d4ed8 : 0xb45309,
        emissiveIntensity: 0.5
      })
      const sphere = new THREE.Mesh(geo, mat)
      sphere.position.set(w.pos_x, w.pos_y + 0.08, w.pos_z)
      sphere.userData.widgetId = w.id
      group.add(sphere)
    })
  }, [widgets, selectedWidget])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = false
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragging.current = true
    cameraTheta.current -= dx * 0.01
    cameraPhi.current = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi.current + dy * 0.01))
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }

  const handleWheel = (e: React.WheelEvent) => {
    cameraRadius.current = Math.max(1, Math.min(50, cameraRadius.current + e.deltaY * 0.01))
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) return
    if (!canvasRef.current || !cameraRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current)

    // Check widget marker hits first
    const markerHits = raycaster.intersectObjects(widgetMarkersRef.current.children)
    if (markerHits.length > 0) {
      const wid = markerHits[0].object.userData.widgetId as number
      const found = widgets.find(w => w.id === wid)
      if (found) { onSelectWidget(found); return }
    }

    // Hit the ground plane to place a new widget
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const target = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, target)
    if (target) {
      setNewWidgetPos({ x: parseFloat(target.x.toFixed(3)), y: parseFloat(target.y.toFixed(3)), z: parseFloat(target.z.toFixed(3)) })
      setNewWidgetName(`Widget ${widgets.length + 1}`)
      setShowCreateWidget(true)
    }
  }, [widgets, onSelectWidget])

  const handleCreateWidget = async () => {
    const w = await createWidget(map.id, {
      name: newWidgetName,
      pos_x: newWidgetPos.x,
      pos_y: newWidgetPos.y,
      pos_z: newWidgetPos.z,
      data_key: newWidgetKey,
    })
    onWidgetCreate(w)
    setShowCreateWidget(false)
    setNewWidgetName('')
    setNewWidgetKey('default')
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="bg-slate-900/80 backdrop-blur rounded-lg px-3 py-2 text-sm text-white font-medium">
          {map.name}
          {map.file_type && <span className="ml-2 text-xs text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded">{map.file_type}</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCalibration(true)}
            className="bg-slate-800/90 backdrop-blur hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm border border-slate-600"
          >⚙ Calibrate</button>
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/70 backdrop-blur text-xs text-slate-400 px-3 py-1 rounded-full pointer-events-none">
        Click on the ground to add a widget · Drag to rotate · Scroll to zoom
      </div>

      {/* 3D Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Widgets bar at bottom */}
      {widgets.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 flex gap-2 overflow-x-auto pb-1">
          {widgets.map(w => (
            <div key={w.id} className="shrink-0 w-48">
              <DataWidget
                widget={w}
                latestData={widgetLatest[w.id]}
                isSelected={selectedWidget?.id === w.id}
                onClick={() => onSelectWidget(w)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create Widget Modal */}
      {showCreateWidget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-80 border border-slate-600">
            <h3 className="text-white font-bold mb-3">Create Widget</h3>
            <p className="text-slate-400 text-xs mb-3">
              Position: ({newWidgetPos.x}, {newWidgetPos.y}, {newWidgetPos.z})
            </p>
            <div className="space-y-2">
              <input
                className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none"
                placeholder="Widget name"
                value={newWidgetName}
                onChange={e => setNewWidgetName(e.target.value)}
                autoFocus
              />
              <input
                className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none"
                placeholder="Data key (e.g. temperature)"
                value={newWidgetKey}
                onChange={e => setNewWidgetKey(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreateWidget} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">Create</button>
              <button onClick={() => setShowCreateWidget(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCalibration && (
        <MapCalibration map={map} onClose={() => setShowCalibration(false)} onUpdate={onMapUpdate} />
      )}
    </div>
  )
}
