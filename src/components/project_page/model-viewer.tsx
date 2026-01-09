"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { 
  useGLTF, Stage, OrbitControls, Html, useProgress, 
  AdaptiveDpr, AdaptiveEvents, GizmoHelper, GizmoViewport, 
  Grid, Bvh, Center, Environment
} from "@react-three/drei"
import { Suspense, useState, useEffect, useCallback, memo, useMemo, useRef } from "react"
import * as THREE from "three"

// ============================================
// 1. COMPACT ICONS & HELPERS
// ============================================

const Icons = {
  Section: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 4h16v16H4z"/><path d="M4 12h16" strokeDasharray="4 2"/></svg>,
  Wireframe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  Ortho: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/></svg>,
  Reset: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  Grid: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>,
  AutoRotate: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>,
  Fullscreen: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  Menu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
}

const useDevice = () => {
  const [isMobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.matchMedia("(max-width: 640px)").matches)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// ============================================
// 2. SCENE COMPONENTS
// ============================================

const ClippingManager = memo(({ enabled, position, axis }: { enabled: boolean, position: number, axis: 'x'|'y'|'z' }) => {
  const { gl } = useThree()
  const plane = useMemo(() => {
    const normal = new THREE.Vector3(axis === 'x' ? -1 : 0, axis === 'y' ? -1 : 0, axis === 'z' ? -1 : 0)
    return new THREE.Plane(normal, position)
  }, [axis, position])

  useEffect(() => {
    gl.clippingPlanes = enabled ? [plane] : []
    gl.localClippingEnabled = true
    return () => { gl.clippingPlanes = [] }
  }, [enabled, plane, gl])

  return null
})

const Model = memo(({ src, wireframe, onLoad, onBoundsCalculated }: { src: string, wireframe: boolean, onLoad: () => void, onBoundsCalculated?: (minY: number) => void }) => {
  // useDraco=true automatically handles Draco-compressed models
  const { scene } = useGLTF(src, true)
  
  useEffect(() => {
    // Calculate bounding box to find the bottom of the model
    const box = new THREE.Box3().setFromObject(scene)
    if (onBoundsCalculated) {
      onBoundsCalculated(box.min.y)
    }
    
    scene.traverse((child) => {
      // 1. Check if it is a Mesh and cast it to THREE.Mesh
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

        mats.forEach((m) => {
          // 2. Cast to a material type that supports wireframe (e.g., MeshStandardMaterial)
          const material = m as THREE.MeshStandardMaterial
          
          material.wireframe = wireframe
          material.clipShadows = true
          material.needsUpdate = true
        })
      }
    })
    onLoad()
  }, [scene, wireframe, onLoad, onBoundsCalculated])

  return <primitive object={scene} />
})

const CameraHandler = memo(({ ortho, controlsRef }: { ortho: boolean, controlsRef: any }) => {
  const { camera } = useThree()
  useEffect(() => {
    // Reset camera when switching modes to prevent getting stuck
    controlsRef.current?.reset()
  }, [ortho, controlsRef])
  
  // Use a simpler approach to toggle mode without complex matrix math
  if (ortho && !(camera instanceof THREE.OrthographicCamera)) return null // Let Canvas handle switching via key prop
  return null
})

// ============================================
// 3. UI COMPONENTS
// ============================================

const Loader = () => {
  const { progress, active, item } = useProgress()
  return (
    <Html center className="z-50">
      <div className="flex flex-col items-center gap-3 bg-white/90 dark:bg-black/90 p-6 rounded-2xl backdrop-blur-md shadow-xl min-w-[200px]">
        <div className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {Math.round(progress)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
            {active ? "Loading model..." : "Preparing..."}
          </span>
        </div>
      </div>
    </Html>
  )
}

const ControlBtn = ({ onClick, active, children, title }: any) => (
  <button onClick={onClick} title={title} className={`p-2.5 rounded-lg backdrop-blur-md transition-all ${
    active ? 'bg-blue-500 text-white shadow-lg scale-105' : 'bg-white/90 text-gray-700 hover:bg-gray-100 dark:bg-gray-800/90 dark:text-gray-300'
  } border border-white/20 shadow-sm`}>
    {children}
  </button>
)

// ============================================
// 4. MAIN VIEWER
// ============================================

export default function ModelViewer({ src, poster, className, showControls = true }: { src: string, poster?: string, className?: string, showControls?: boolean }) {
  const isMobile = useDevice()
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [gridY, setGridY] = useState(0) // Dynamic grid Y position based on model bounds
  
  // Consolidated State
  const [config, setConfig] = useState({
    wireframe: false,
    grid: !isMobile,
    autoRotate: false,
    ortho: false,
    section: false,
    clipPos: 0,
    clipAxis: 'y' as 'x'|'y'|'z'
  })

  const toggle = (k: keyof typeof config) => setConfig(p => ({ ...p, [k]: !p[k] }))
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-gray-50 dark:bg-gray-900 overflow-hidden ${className}`}>
      
      {/* Poster / Loading State */}
      {!loaded && poster && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100">
          <img src={poster} alt="Preview" className="w-full h-full object-contain opacity-50" />
        </div>
      )}

      {/* UI Controls */}
      {showControls && loaded && (
        <>
          {/* Desktop Toolbar */}
          {!isMobile && (
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
              <div className="flex gap-2">
                <ControlBtn onClick={() => toggle('section')} active={config.section} title="Section"><Icons.Section /></ControlBtn>
                {/* <ControlBtn onClick={() => toggle('wireframe')} active={config.wireframe} title="Wireframe"><Icons.Wireframe /></ControlBtn> */}
                <ControlBtn onClick={() => toggle('grid')} active={config.grid} title="Grid"><Icons.Grid /></ControlBtn>
                <ControlBtn onClick={() => toggle('ortho')} active={config.ortho} title="Ortho"><Icons.Ortho /></ControlBtn>
              </div>
              <div className="flex gap-2 justify-end">
                <ControlBtn onClick={() => toggle('autoRotate')} active={config.autoRotate} title="Rotate"><Icons.AutoRotate /></ControlBtn>
                <ControlBtn onClick={() => controlsRef.current?.reset()} title="Reset"><Icons.Reset /></ControlBtn>
                <ControlBtn onClick={toggleFullscreen} title="Full"><Icons.Fullscreen /></ControlBtn>
              </div>
            </div>
          )}

          {/* Mobile Menu */}
          {isMobile && (
            <div className="absolute top-4 right-4 z-30">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-3 bg-white/90 rounded-full shadow-lg backdrop-blur-md dark:bg-gray-800/90 dark:text-white">
                {menuOpen ? <Icons.Close /> : <Icons.Menu />}
              </button>
              {menuOpen && (
                <div className="absolute top-14 right-0 w-48 py-2 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col gap-1 p-2">
                  {[
                    { k: 'section', l: 'Section Cut', i: <Icons.Section /> },
                    { k: 'wireframe', l: 'Wireframe', i: <Icons.Wireframe /> },
                    { k: 'grid', l: 'Show Grid', i: <Icons.Grid /> },
                    { k: 'ortho', l: 'Orthographic', i: <Icons.Ortho /> },
                    { k: 'autoRotate', l: 'Auto Rotate', i: <Icons.AutoRotate /> },
                  ].map((item) => (
                    <button key={item.k} onClick={() => toggle(item.k as any)} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${config[item.k as keyof typeof config] ? 'bg-blue-50 text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                      {item.i} {item.l}
                    </button>
                  ))}
                  <div className="h-px bg-gray-200 my-1" />
                  <button onClick={toggleFullscreen} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300"><Icons.Fullscreen /> Fullscreen</button>
                </div>
              )}
            </div>
          )}

          {/* Section Slider */}
          {config.section && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-white/90 dark:bg-gray-800/90 p-4 rounded-xl shadow-xl backdrop-blur-md flex flex-col gap-3 min-w-[280px]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-gray-500">Slice Axis</span>
                <div className="flex gap-1">
                  {(['x', 'y', 'z'] as const).map(axis => (
                    <button key={axis} onClick={() => setConfig(p => ({ ...p, clipAxis: axis }))} className={`px-3 py-1 text-xs rounded-md font-bold ${config.clipAxis === axis ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      {axis.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <input type="range" min="-5" max="5" step="0.1" value={config.clipPos} onChange={(e) => setConfig(p => ({ ...p, clipPos: parseFloat(e.target.value) }))} className="w-full accent-blue-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
          )}
        </>
      )}

      {/* 3D Canvas */}
      <Canvas 
        frameloop="demand" 
        shadows={!isMobile} 
        camera={{ position: [5, 5, 5], fov: 45 }}
        orthographic={config.ortho}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{ preserveDrawingBuffer: true, localClippingEnabled: true }}
      >
        <Suspense fallback={<Loader />}>
          {/* Model centered on X/Z axes */}
          <Center disableY>
            <Bvh firstHitOnly>
              <Model 
                src={src} 
                wireframe={config.wireframe} 
                onLoad={() => setLoaded(true)} 
                onBoundsCalculated={(minY) => setGridY(minY - 0.001)}
              />
            </Bvh>
          </Center>
          
          {/* Lightweight environment - "apartment" is smaller than "city" */}
          <Environment preset="apartment" />
          
          {/* Simple lighting instead of Stage's heavy setup */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} castShadow={!isMobile} />
          
          {config.grid && (
            <Grid 
              args={[100, 100]} 
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#6b7280"   
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#374151" 
              position={[0, gridY, 0]} 
              fadeDistance={50}
              fadeStrength={1}
              followCamera={false}
            />
          )}
          
          <ClippingManager enabled={config.section} position={config.clipPos} axis={config.clipAxis} />
          
          <OrbitControls 
            ref={controlsRef} 
            makeDefault 
            autoRotate={config.autoRotate} 
            autoRotateSpeed={1}
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 1.75}
          />
          
          <GizmoHelper alignment="bottom-left" margin={[20, 20]}>
            <GizmoViewport axisColors={['#f87171', '#4ade80', '#60a5fa']} labelColor="black" />
          </GizmoHelper>

          <CameraHandler ortho={config.ortho} controlsRef={controlsRef} />
        </Suspense>

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
    </div>
  )
}

// Preload helper - call this on hover or before navigation
export const preloadModel = (src: string) => useGLTF.preload(src, true)