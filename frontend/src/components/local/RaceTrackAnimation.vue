<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import * as Three from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js"
import { useRacingStore } from "@/stores/racing"

const racingStore = useRacingStore()
const canvasContainer = ref(null)

let scene, camera, renderer, controls
let trackPath, trackMesh, vehicles = []
let animationFrameId

const VEHICLE_SIZE = 0.15
const TRACK_WIDTH = 0.8

// Circuit of the Americas track coordinates (approximated from track map)
const createCOTAPath = () => {
	const points = [
		// Start/Finish straight and Turn 1 (uphill left)
		new Three.Vector3(0, 0, 0),
		new Three.Vector3(0.5, 0, -1),
		new Three.Vector3(1, 0.2, -2),
		new Three.Vector3(1.2, 0.3, -3),
		
		// Turn 2-3 (left-right chicane)
		new Three.Vector3(1, 0.3, -3.5),
		new Three.Vector3(0.5, 0.3, -4),
		new Three.Vector3(0.8, 0.3, -4.5),
		
		// Turns 3-6 (technical section)
		new Three.Vector3(1.5, 0.2, -5),
		new Three.Vector3(2, 0.2, -5.5),
		new Three.Vector3(2.5, 0.2, -5.3),
		new Three.Vector3(3, 0.2, -5),
		new Three.Vector3(3.3, 0.2, -4.5),
		
		// Turns 7-9 (fast sweepers)
		new Three.Vector3(3.5, 0.1, -4),
		new Three.Vector3(3.8, 0.1, -3),
		new Three.Vector3(4, 0.1, -2),
		new Three.Vector3(4.2, 0.1, -1),
		
		// Turn 10-11 (hairpin complex)
		new Three.Vector3(4.3, 0.1, 0),
		new Three.Vector3(4.2, 0.1, 1),
		new Three.Vector3(3.8, 0.1, 1.5),
		new Three.Vector3(3.2, 0.1, 1.3),
		
		// Turn 12 (long straight entry)
		new Three.Vector3(2.5, 0, 1),
		new Three.Vector3(1.5, 0, 1),
		new Three.Vector3(0.5, 0, 1.2),
		
		// Turns 13-15 (stadium section)
		new Three.Vector3(-0.5, 0, 1.5),
		new Three.Vector3(-1.2, 0, 1.8),
		new Three.Vector3(-1.8, 0, 2),
		new Three.Vector3(-2.3, 0, 1.8),
		new Three.Vector3(-2.6, 0, 1.3),
		
		// Turn 16-17 (technical)
		new Three.Vector3(-2.8, 0, 0.5),
		new Three.Vector3(-2.9, 0, -0.3),
		new Three.Vector3(-2.7, 0, -1),
		
		// Turn 18 (left hander)
		new Three.Vector3(-2.3, 0, -1.5),
		new Three.Vector3(-1.8, 0, -1.8),
		
		// Turn 19 (hairpin)
		new Three.Vector3(-1.2, 0, -1.9),
		new Three.Vector3(-0.5, 0, -1.7),
		new Three.Vector3(0, 0, -1.3),
		
		// Turn 20 and back to start
		new Three.Vector3(0.3, 0, -0.8),
		new Three.Vector3(0.2, 0, -0.3),
		new Three.Vector3(0, 0, 0)
	]
	
	return new Three.CatmullRomCurve3(points, true)
}

onMounted(() => {
	initScene()
	createTrack()
	createSectorMarkers()
	createVehicles()
	animate()
	window.addEventListener("resize", onResize)
	
	racingStore.loadInitialData()
})

onBeforeUnmount(() => {
	window.removeEventListener("resize", onResize)
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId)
	}
	if (renderer) {
		renderer.dispose()
	}
})

watch(() => racingStore.vehicles, (newVehicles) => {
	updateVehiclePositions(newVehicles)
}, { deep: true })

const initScene = () => {
	const width = canvasContainer.value.clientWidth
	const height = canvasContainer.value.clientHeight

	scene = new Three.Scene()
	scene.background = new Three.Color(0x000000)
	scene.fog = new Three.Fog(0x000000, 10, 50)

	camera = new Three.PerspectiveCamera(60, width / height, 0.1, 1000)
	camera.position.set(0, 8, 8)
	camera.lookAt(0, 0, 0)

	renderer = new Three.WebGLRenderer({ antialias: true, alpha: true })
	renderer.setSize(width, height)
	renderer.setPixelRatio(window.devicePixelRatio)
	canvasContainer.value.appendChild(renderer.domElement)

	controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true
	controls.dampingFactor = 0.05
	controls.minDistance = 5
	controls.maxDistance = 20
	controls.maxPolarAngle = Math.PI / 2.2
	controls.autoRotate = true
	controls.autoRotateSpeed = 0.3

	const ambientLight = new Three.AmbientLight(0xffffff, 0.4)
	scene.add(ambientLight)

	const directionalLight = new Three.DirectionalLight(0xffffff, 0.8)
	directionalLight.position.set(5, 10, 5)
	scene.add(directionalLight)

	const pointLight1 = new Three.PointLight(0x00ff9d, 1, 15)
	pointLight1.position.set(0, 3, 0)
	scene.add(pointLight1)

	const gridHelper = new Three.GridHelper(20, 20, 0x00ff9d, 0x333333)
	gridHelper.material.opacity = 0.15
	gridHelper.material.transparent = true
	scene.add(gridHelper)
}

const createTrack = () => {
	trackPath = createCOTAPath()
	
	// Create track surface using TubeGeometry
	const tubeGeometry = new Three.TubeGeometry(trackPath, 200, TRACK_WIDTH, 8, false)
	const trackMaterial = new Three.MeshStandardMaterial({
		color: 0x1a1a1a,
		metalness: 0.3,
		roughness: 0.8,
		side: Three.DoubleSide
	})
	trackMesh = new Three.Mesh(tubeGeometry, trackMaterial)
	scene.add(trackMesh)
	
	// Create glowing track boundaries
	const points = trackPath.getPoints(200)
	
	// Outer boundary
	const outerGeometry = new Three.BufferGeometry().setFromPoints(points)
	const outerMaterial = new Three.LineBasicMaterial({
		color: 0x00ff9d,
		linewidth: 2
	})
	const outerLine = new Three.Line(outerGeometry, outerMaterial)
	outerLine.position.y = 0.05
	scene.add(outerLine)
	
	// Inner boundary
	const innerMaterial = new Three.LineBasicMaterial({
		color: 0x00aaff,
		linewidth: 2
	})
	const innerLine = new Three.Line(outerGeometry, innerMaterial)
	innerLine.position.y = 0.05
	scene.add(innerLine)
	
	// Start/Finish line
	const startLineGeometry = new Three.BoxGeometry(TRACK_WIDTH * 2, 0.05, 0.2)
	const startLineMaterial = new Three.MeshStandardMaterial({
		color: 0xffff00,
		emissive: 0xffff00,
		emissiveIntensity: 0.8
	})
	const startLine = new Three.Mesh(startLineGeometry, startLineMaterial)
	const startPos = trackPath.getPoint(0)
	startLine.position.copy(startPos)
	startLine.position.y = 0.05
	scene.add(startLine)
}

const createSectorMarkers = () => {
	const sectorPositions = [
		{ t: 0.15, label: 'S1', color: 0xff6b6b },
		{ t: 0.50, label: 'S2', color: 0x4ecdc4 },
		{ t: 0.85, label: 'S3', color: 0xffe66d }
	]
	
	sectorPositions.forEach(sector => {
		// Create marker cylinder
		const markerGeometry = new Three.CylinderGeometry(0.15, 0.15, 0.5, 16)
		const markerMaterial = new Three.MeshStandardMaterial({
			color: sector.color,
			emissive: sector.color,
			emissiveIntensity: 0.5
		})
		const marker = new Three.Mesh(markerGeometry, markerMaterial)
		
		const pos = trackPath.getPoint(sector.t)
		marker.position.copy(pos)
		marker.position.y = 0.25
		scene.add(marker)
		
		// Add glow ring
		const ringGeometry = new Three.TorusGeometry(0.2, 0.02, 16, 32)
		const ringMaterial = new Three.MeshStandardMaterial({
			color: sector.color,
			emissive: sector.color,
			emissiveIntensity: 0.8
		})
		const ring = new Three.Mesh(ringGeometry, ringMaterial)
		ring.position.copy(pos)
		ring.position.y = 0.01
		ring.rotation.x = Math.PI / 2
		scene.add(ring)
	})
}

const createVehicles = () => {
	for (let i = 0; i < 10; i++) {
		const vehicleGroup = new Three.Group()

		// Car body
		const bodyGeometry = new Three.BoxGeometry(VEHICLE_SIZE, VEHICLE_SIZE * 0.5, VEHICLE_SIZE * 1.5)
		const bodyMaterial = new Three.MeshStandardMaterial({
			color: i % 2 === 0 ? 0x00ff9d : 0x00aaff,
			emissive: i % 2 === 0 ? 0x00ff9d : 0x00aaff,
			emissiveIntensity: 0.3,
			metalness: 0.9,
			roughness: 0.1
		})
		const body = new Three.Mesh(bodyGeometry, bodyMaterial)
		body.position.y = VEHICLE_SIZE * 0.25
		vehicleGroup.add(body)

		// Wheels
		const wheelGeometry = new Three.CylinderGeometry(0.04, 0.04, 0.03, 16)
		const wheelMaterial = new Three.MeshStandardMaterial({ color: 0x222222 })
		
		const positions = [
			[-VEHICLE_SIZE * 0.4, 0, VEHICLE_SIZE * 0.5],
			[VEHICLE_SIZE * 0.4, 0, VEHICLE_SIZE * 0.5],
			[-VEHICLE_SIZE * 0.4, 0, -VEHICLE_SIZE * 0.5],
			[VEHICLE_SIZE * 0.4, 0, -VEHICLE_SIZE * 0.5]
		]
		
		positions.forEach(pos => {
			const wheel = new Three.Mesh(wheelGeometry, wheelMaterial)
			wheel.position.set(...pos)
			wheel.rotation.z = Math.PI / 2
			vehicleGroup.add(wheel)
		})

		// Position on track
		const t = i / 10
		const pos = trackPath.getPoint(t)
		vehicleGroup.position.copy(pos)
		
		vehicleGroup.userData = {
			t: t,
			speed: 0.001 + Math.random() * 0.002,
			vehicleId: null
		}

		scene.add(vehicleGroup)
		vehicles.push(vehicleGroup)
	}
}

const updateVehiclePositions = (vehicleData) => {
	if (!vehicleData || vehicleData.length === 0) return

	vehicleData.forEach((data, index) => {
		if (index < vehicles.length) {
			const vehicle = vehicles[index]
			vehicle.userData.vehicleId = data.vehicle_id
		}
	})
}

const animate = () => {
	animationFrameId = requestAnimationFrame(animate)

	// Animate vehicles along the track path
	vehicles.forEach(vehicle => {
		vehicle.userData.t += vehicle.userData.speed
		if (vehicle.userData.t > 1) vehicle.userData.t = 0
		
		const pos = trackPath.getPoint(vehicle.userData.t)
		vehicle.position.copy(pos)
		
		// Get tangent for rotation
		const tangent = trackPath.getTangent(vehicle.userData.t)
		const angle = Math.atan2(tangent.x, tangent.z)
		vehicle.rotation.y = angle
	})

	controls.update()
	renderer.render(scene, camera)
}

const onResize = () => {
	if (!canvasContainer.value) return
	
	const width = canvasContainer.value.clientWidth
	const height = canvasContainer.value.clientHeight

	camera.aspect = width / height
	camera.updateProjectionMatrix()
	renderer.setSize(width, height)
}
</script>

<template>
	<div ref="canvasContainer" :class="$style.container" />
</template>

<style module>
.container {
	width: 100%;
	height: 100%;
	position: relative;
	border-radius: 8px;
	overflow: hidden;
}
</style>
