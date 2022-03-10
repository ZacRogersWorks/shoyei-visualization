import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import anime from 'animejs/lib/anime.min.js'
import * as dat from 'lil-gui'
import { mapLinear } from 'three/src/math/MathUtils'
import galaxyVertexShader from './shaders/galaxy/vertex.glsl'
import galaxyFragmentShader from './shaders/galaxy/fragment.glsl'

const body = document.querySelector('body')
const audio = document.getElementById('audio')
const playBtn = document.getElementById('play-btn')
const icon = document.getElementById('icon')

// Audio Play Button
let isPlaying = false;
playBtn.innerText = 'Start'

function playPause() {
    if (isPlaying) {
        audio.pause();
        playBtn.innerText = 'Play'
        isPlaying = false
        icon.style.display = 'none'
    } else {
        audio.play();
        isPlaying = true
        playBtn.innerText = 'Pause'
        icon.style.display = 'block'
    }
}
playBtn.addEventListener('click', playPause)

playBtn.addEventListener('click', () => {
    /**
     * Base
     */



    // Debug
    const gui = new dat.GUI()
    gui.hide()

    // Loaders //
    const loadingManager = new THREE.LoadingManager(
        // Loaded
        () => {
            anime({
                
            })
        },

        // Progress
        () => {
            console.log('progress')
        }
    )
    const textureLoader = new THREE.TextureLoader(loadingManager)



    // Audio Visualizer //
    const ctx = new AudioContext()
    const audioSrc = ctx.createMediaElementSource(audio)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 32
    analyser.minDecibels = -55
    audioSrc.connect(analyser)
    audioSrc.connect(ctx.destination)
    let frequencyData = new Uint8Array(analyser.frequencyBinCount);

    // Canvas
    const canvas = document.querySelector('canvas.webgl')

    // Scene
    const scene = new THREE.Scene()

    // Rotating group
    const group = new THREE.Group()

    // Loading Plane
    // const loadGeo = new THREE.PlaneGeometry(200, 200, 1, 1)
    // const loadMat = new THREE.ShaderMaterial({
    //     transparent: true,
    //     uniforms:
    //     {
    //         uAlpha: { value: 1 }
    //     },
    //     vertexShader: `
    //         void main()
    //         {
    //             gl_Position = vec4(position, 1.0);
    //         }
    //     `,
    //     fragmentShader: `
    //         uniform float uAlpha;
    //         void main()
    //         {
    //             gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
    //         }
    //     `
    // })
    // const loadMesh = new THREE.Mesh(loadGeo, loadMat)
    // loadMesh.rotation.y = -0.80
    // loadMesh.position.x = -5.2
    // scene.add(loadMesh)

    // gui.add(loadMesh.rotation, 'y').min(-10).max(10).step(.001).name('Loading Rotate')
    // gui.add(loadMesh.position, 'x').min(-50).max(50).step(.001).name('Loading Position x')
    // gui.add(loadMesh.position, 'z').min(-50).max(50).step(.001).name('Loading Position z')

    // Background Plane
    const bgGeo = new THREE.PlaneGeometry(150, 150)
    const bgTexture = textureLoader.load('background.jpeg')
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTexture })
    const bgMesh = new THREE.Mesh(bgGeo, bgMat)
    bgMesh.rotation.y = -0.58
    bgMesh.position.x = 15
    bgMesh.position.z = -50

    scene.add(bgMesh)
    group.add(bgMesh)

    gui.add(bgMesh.rotation, 'y').min(-10).max(10).step(.001).name('Background Rotate')
    gui.add(bgMesh.position, 'x').min(-50).max(50).step(.001).name('Background Position x')
    gui.add(bgMesh.position, 'z').min(-50).max(50).step(.001).name('Background Position z')

    /**
     * Galaxy
     */
    const parameters = {}
    parameters.count = 200000
    parameters.size = 0.005
    parameters.radius = 5
    parameters.branches = 5
    parameters.spin = 1
    parameters.randomness = 0.5
    parameters.randomnessPower = 3
    parameters.insideColor = '#f50083'
    parameters.outsideColor = '#0dd3d0'

    let geometry = null
    let material = null
    let points = null

    const generateGalaxy = () => {
        if (points !== null) {
            geometry.dispose()
            material.dispose()
            scene.remove(points)
        }

        /**
         * Geometry
         */
        geometry = new THREE.BufferGeometry()

        const positions = new Float32Array(parameters.count * 3)
        const colors = new Float32Array(parameters.count * 3)
        const scales = new Float32Array(parameters.count)
        const randomness = new Float32Array(parameters.count * 3)

        const insideColor = new THREE.Color(parameters.insideColor)
        const outsideColor = new THREE.Color(parameters.outsideColor)

        for (let i = 0; i < parameters.count; i++) {
            const i3 = i * 3

            // Position
            const radius = Math.random() * parameters.radius

            const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2


            positions[i3] = Math.cos(branchAngle) * radius
            positions[i3 + 1] = 0
            positions[i3 + 2] = Math.sin(branchAngle) * radius

            // Randomness
            const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius * 5
            const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
            const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius * 3

            randomness[i3 + 0] = randomX
            randomness[i3 + 1] = randomY
            randomness[i3 + 2] = randomZ
            // Color
            const mixedColor = insideColor.clone()
            mixedColor.lerp(outsideColor, radius / parameters.radius)

            colors[i3] = mixedColor.r
            colors[i3 + 1] = mixedColor.g
            colors[i3 + 2] = mixedColor.b

            //Scale
            scales[i] = Math.random()
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.setAttribute('aScale', new THREE.BufferAttribute(colors, 1))
        geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))

        /**
         * Material
         */
        material = new THREE.ShaderMaterial({
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            vertexShader: galaxyVertexShader,
            fragmentShader: galaxyFragmentShader,

            uniforms: {
                uTime: { value: 0 },
                uSize: { value: 30 * renderer.getPixelRatio() },
                uAudioLow: { value: 0 },
                uAudioHigh: { value: 0 }
            }
        })

        /**
         * Points
         */
        points = new THREE.Points(geometry, material)
        scene.add(points)
    }



    gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
    gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
    gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
    gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
    gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
    gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
    gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)


    // ** Space Ship ** 



    const bakedTexture = textureLoader.load('Challenger_Blue.png')
    bakedTexture.flipY = false
    bakedTexture.encoding = THREE.sRGBEncoding
    const bakedMaterial = new THREE.MeshStandardMaterial({ map: bakedTexture })


    // Draco loader
    const dracoLoader = new DRACOLoader(loadingManager)
    dracoLoader.setDecoderPath('draco/')

    // GLTF loader
    const gltfLoader = new GLTFLoader(loadingManager)
    gltfLoader.setDRACOLoader(dracoLoader)

    let gltfModel = new THREE.Object3D()

    let gltfParams = {}
    gltfParams.rotateX = 0
    gltfParams.rotateY = 3.61
    gltfParams.rotateZ = 0
    gltfParams.positionX = -2.6
    gltfParams.positionY = 0.4
    gltfParams.positionZ = 2.4

    gltfLoader.load('Challenger.gltf', (gltf) => {
        gltfModel = gltf
        gltfModel.scene.scale.set(0.01, 0.01, 0.01)
        gltfModel.scene.receiveShadow = true
        gltfModel.scene.castShadow = true
        gltfModel.scene.rotation.set(gltfParams.rotateX, gltfParams.rotateY, gltfParams.rotateZ)
        gltfModel.scene.position.set(gltfParams.positionX, gltfParams.positionY, gltfParams.positionZ)
        gltfModel.scene.traverse((child) => {
            child.material = bakedMaterial
            if (child.isMesh) {
                child.receiveShadow = true
                child.castShadow = true
                child.geometry.computeVertexNormals()
            }
        })
        group.add(gltfModel.scene)
        console.log(gltfModel)
    })

    scene.add(group)


    gui.add(gltfParams, 'rotateX').min(0).max(10).step(.001).name('GLTF Rotate X').onFinishChange(() => gltfModel.scene.rotation.x = gltfParams.rotateX)
    gui.add(gltfParams, 'rotateY').min(0).max(10).step(.001).name('GLTF Rotate Y').onFinishChange(() => gltfModel.scene.rotation.y = gltfParams.rotateY)
    gui.add(gltfParams, 'rotateZ').min(0).max(10).step(.001).name('GLTF Rotate Z').onFinishChange(() => gltfModel.scene.rotation.z = gltfParams.rotateZ)
    gui.add(gltfParams, 'positionX').min(-10).max(10).step(.01).name('GLTF Position X').onChange(() => gltfModel.scene.position.x = gltfParams.positionX)
    gui.add(gltfParams, 'positionY').min(-10).max(10).step(.01).name('GLTF Position Y').onChange(() => gltfModel.scene.position.y = gltfParams.positionY)
    gui.add(gltfParams, 'positionZ').min(-10).max(10).step(.01).name('GLTF Position Z').onChange(() => gltfModel.scene.position.z = gltfParams.positionZ)

    // ** Lens Flare **//
    const textureFlare0 = textureLoader.load("lensflare4.png");
    const lensflare = new Lensflare();

    lensflare.addElement(new LensflareElement(textureFlare0, 512, 0));

    //** Lights **/
    const pointLight = new THREE.PointLight(0xffffff, 20)
    pointLight.position.set(-2.57, 0.39, 2.46)
    pointLight.castShadow = true;
    scene.add(pointLight)
    pointLight.add(lensflare);
    group.add(pointLight)

    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    window.addEventListener('resize', () => {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
    camera.position.x = -2.5
    camera.position.y = .5
    camera.position.z = 3
    scene.add(camera)

    gui.add(camera.position, 'x').min(-10).max(10).step(.1).name('Camera X')
    gui.add(camera.position, 'y').min(-10).max(10).step(.1).name('Camera Y')
    gui.add(camera.position, 'z').min(-10).max(10).step(.1).name('Camera Z')


    // Controls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.enabled = false
    controls.autoRotate = true
    controls.autoRotateSpeed = .025

    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })
    renderer.shadowMap.enabled = true;
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


    // Generate Galaxy //
    generateGalaxy()

    /**
     * Animate
     */
    const clock = new THREE.Clock()

    const tick = () => {
        const elapsedTime = clock.getElapsedTime()

        // Update material
        material.uniforms.uTime.value = elapsedTime

        // Update controls
        controls.update()

        // Rotate spaceship around origin
        group.rotation.y = .1 - (elapsedTime * .0025)
        // gltfModel.rotation.z.set(Math.sin(elapsedTime * .3))

        // Audio data
        analyser.getByteFrequencyData(frequencyData)
        material.uniforms.uAudioLow.value = frequencyData[2]
        material.uniforms.uAudioHigh.value = frequencyData[5]
        // pointLight.intensity = frequencyData[5]
        // console.log(frequencyData)
        // Render
        renderer.render(scene, camera)

        // Call tick again on the next frame
        window.requestAnimationFrame(tick)
    }


    tick()

})