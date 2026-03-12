'use client'
import { useEffect, useRef } from 'react'

export default function VectorView3D({ data, explanation }) {

    const mountRef = useRef(null)

    useEffect(() => {

        if (!mountRef.current || !data?.vectors?.length) return

        let renderer
        let scene
        let camera
        let frameId

        let isDragging = false
        let prevMouse = { x: 0, y: 0 }

        let theta = 0.5
        let phi = 0.6
        let radius = 12

        async function init() {

            const THREE = await import('three')

            const container = mountRef.current
            const width = container.clientWidth
            const height = container.clientHeight

            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            })

            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            renderer.setSize(width, height)

            container.appendChild(renderer.domElement)

            scene = new THREE.Scene()

            camera = new THREE.PerspectiveCamera(
                50,
                width / height,
                0.1,
                100
            )

            scene.add(new THREE.AmbientLight(0xffffff, 0.6))

            const dirLight = new THREE.DirectionalLight(0xffd700, 0.8)
            dirLight.position.set(5, 8, 5)

            scene.add(dirLight)

            const grid = new THREE.GridHelper(10, 10, 0x1e2d4a, 0x1e2d4a)
            scene.add(grid)

            const axisLen = 5

            const axes = [
                { dir: new THREE.Vector3(1, 0, 0), color: 0xf87171 },
                { dir: new THREE.Vector3(0, 1, 0), color: 0x34d399 },
                { dir: new THREE.Vector3(0, 0, 1), color: 0x38bdf8 }
            ]

            axes.forEach(({ dir, color }) => {

                const mat = new THREE.LineBasicMaterial({ color })

                const geom = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    dir.clone().multiplyScalar(axisLen)
                ])

                scene.add(new THREE.Line(geom, mat))

            })

            data.vectors.forEach(v => {

                const color = parseInt((v.color || '#f0c040').replace('#', ''), 16)

                const end = new THREE.Vector3(v.x, v.y, v.z)

                const line = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    end
                ])

                const mat = new THREE.LineBasicMaterial({ color })

                scene.add(new THREE.Line(line, mat))

                const coneGeom = new THREE.ConeGeometry(0.12, 0.35, 12)

                const coneMat = new THREE.MeshStandardMaterial({
                    color,
                    emissive: color,
                    emissiveIntensity: 0.3
                })

                const cone = new THREE.Mesh(coneGeom, coneMat)

                const dir = end.clone().normalize()

                cone.position.copy(end)

                cone.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    dir
                )

                scene.add(cone)

            })

            const updateCamera = () => {

                camera.position.set(
                    radius * Math.sin(phi) * Math.sin(theta),
                    radius * Math.cos(phi),
                    radius * Math.sin(phi) * Math.cos(theta)
                )

                camera.lookAt(0, 0, 0)

            }

            updateCamera()

            function onMouseDown(e) {
                isDragging = true
                prevMouse = { x: e.clientX, y: e.clientY }
            }

            function onMouseMove(e) {

                if (!isDragging) return

                const dx = (e.clientX - prevMouse.x) * 0.01
                const dy = (e.clientY - prevMouse.y) * 0.01

                theta -= dx

                phi = Math.max(
                    0.1,
                    Math.min(Math.PI - 0.1, phi + dy)
                )

                prevMouse = { x: e.clientX, y: e.clientY }

                updateCamera()

            }

            function onMouseUp() {
                isDragging = false
            }

            function onWheel(e) {

                radius = Math.max(
                    4,
                    Math.min(20, radius + e.deltaY * 0.02)
                )

                updateCamera()

            }

            renderer.domElement.addEventListener('mousedown', onMouseDown)
            window.addEventListener('mousemove', onMouseMove)
            window.addEventListener('mouseup', onMouseUp)
            renderer.domElement.addEventListener('wheel', onWheel, { passive: true })

            function onResize() {

                const w = container.clientWidth
                const h = container.clientHeight

                renderer.setSize(w, h)

                camera.aspect = w / h
                camera.updateProjectionMatrix()

            }

            window.addEventListener('resize', onResize)

            function animate() {

                frameId = requestAnimationFrame(animate)

                renderer.render(scene, camera)

            }

            animate()

            return () => {

                window.removeEventListener('resize', onResize)

                renderer.domElement.removeEventListener('mousedown', onMouseDown)
                window.removeEventListener('mousemove', onMouseMove)
                window.removeEventListener('mouseup', onMouseUp)
                renderer.domElement.removeEventListener('wheel', onWheel)

            }

        }

        let cleanup

        init().then(fn => cleanup = fn)

        return () => {

            cancelAnimationFrame(frameId)

            cleanup?.()

            if (renderer) {
                renderer.dispose()
            }

            if (mountRef.current && renderer?.domElement) {
                mountRef.current.removeChild(renderer.domElement)
            }

        }

    }, [data])

    return (

        <div className="flex flex-col h-full">

            <div
                ref={mountRef}
                className="flex-1 relative"
            />

            {explanation && (
                <p className="text-xs mt-2">
                    {explanation}
                </p>
            )}

        </div>

    )

}