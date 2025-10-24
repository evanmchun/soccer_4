// Three.js GLB Game - ES6 Module Version
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class GLBGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.mixer = null;
        this.animations = [];
        this.clock = new THREE.Clock();
        this.stats = {
            fps: 0,
            objectCount: 0
        };
        
        this.init();
    }
    
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLights();
        this.setupEventListeners();
        this.animate();
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 30, 250); // Lighter fog for outdoor feel
        
        // Create soccer field
        this.createSoccerField();
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        this.camera.position.set(15, 10, 15);
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.4; // Brighter for natural outdoor feel
        this.renderer.outputEncoding = THREE.sRGBEncoding; // Better color reproduction
        this.renderer.physicallyCorrectLights = true; // More realistic lighting
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    }
    
    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.maxDistance = 80;
        this.controls.minDistance = 3;
    }
    
    createSoccerField() {
        // Create grass field
        const fieldGeometry = new THREE.PlaneGeometry(40, 60);
        const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.rotation.x = -Math.PI / 2;
        field.receiveShadow = true;
        this.scene.add(field);
        
        // Create field lines
        this.createFieldLines();
        
        // Create goal posts
        this.createGoalPosts();
        
        // Create center circle
        this.createCenterCircle();
    }
    
    createFieldLines() {
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        
        // Field boundary
        const boundaryGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-20, 0.01, -30),
            new THREE.Vector3(20, 0.01, -30),
            new THREE.Vector3(20, 0.01, 30),
            new THREE.Vector3(-20, 0.01, 30),
            new THREE.Vector3(-20, 0.01, -30)
        ]);
        const boundary = new THREE.Line(boundaryGeometry, lineMaterial);
        this.scene.add(boundary);
        
        // Center line
        const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-20, 0.01, 0),
            new THREE.Vector3(20, 0.01, 0)
        ]);
        const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
        this.scene.add(centerLine);
        
        // Goal areas
        const goalAreaGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-6, 0.01, -30),
            new THREE.Vector3(6, 0.01, -30),
            new THREE.Vector3(6, 0.01, -24),
            new THREE.Vector3(-6, 0.01, -24),
            new THREE.Vector3(-6, 0.01, -30)
        ]);
        const goalArea1 = new THREE.Line(goalAreaGeometry, lineMaterial);
        this.scene.add(goalArea1);
        
        const goalArea2Geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-6, 0.01, 30),
            new THREE.Vector3(6, 0.01, 30),
            new THREE.Vector3(6, 0.01, 24),
            new THREE.Vector3(-6, 0.01, 24),
            new THREE.Vector3(-6, 0.01, 30)
        ]);
        const goalArea2 = new THREE.Line(goalArea2Geometry, lineMaterial);
        this.scene.add(goalArea2);
    }
    
    createGoalPosts() {
        const goalMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.5);
        
        // Goal 1 (left side)
        const goal1Left = new THREE.Mesh(postGeometry, goalMaterial);
        goal1Left.position.set(-3.5, 1.25, -30);
        goal1Left.castShadow = true;
        this.scene.add(goal1Left);
        
        const goal1Right = new THREE.Mesh(postGeometry, goalMaterial);
        goal1Right.position.set(3.5, 1.25, -30);
        goal1Right.castShadow = true;
        this.scene.add(goal1Right);
        
        const goal1Top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 7), goalMaterial);
        goal1Top.rotation.z = Math.PI / 2;
        goal1Top.position.set(0, 2.5, -30);
        goal1Top.castShadow = true;
        this.scene.add(goal1Top);
        
        // Goal 2 (right side)
        const goal2Left = new THREE.Mesh(postGeometry, goalMaterial);
        goal2Left.position.set(-3.5, 1.25, 30);
        goal2Left.castShadow = true;
        this.scene.add(goal2Left);
        
        const goal2Right = new THREE.Mesh(postGeometry, goalMaterial);
        goal2Right.position.set(3.5, 1.25, 30);
        goal2Right.castShadow = true;
        this.scene.add(goal2Right);
        
        const goal2Top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 7), goalMaterial);
        goal2Top.rotation.z = Math.PI / 2;
        goal2Top.position.set(0, 2.5, 30);
        goal2Top.castShadow = true;
        this.scene.add(goal2Top);
    }
    
    createCenterCircle() {
        const circleGeometry = new THREE.RingGeometry(9.15, 9.25, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            side: THREE.DoubleSide 
        });
        const centerCircle = new THREE.Mesh(circleGeometry, circleMaterial);
        centerCircle.rotation.x = -Math.PI / 2;
        centerCircle.position.y = 0.01;
        this.scene.add(centerCircle);
        
        // Center dot
        const dotGeometry = new THREE.CircleGeometry(0.5, 16);
        const dot = new THREE.Mesh(dotGeometry, circleMaterial);
        dot.rotation.x = -Math.PI / 2;
        dot.position.y = 0.02;
        this.scene.add(dot);
    }

    createLights() {
        // Bright ambient light for natural outdoor illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);
        
        // Soft main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(20, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        this.scene.add(directionalLight);
        
        // Bright hemisphere light for natural outdoor lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.8);
        this.scene.add(hemisphereLight);
        
        // Fill light from the front (no shadows)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 10, -10);
        fillLight.castShadow = false; // No shadows from fill lights
        this.scene.add(fillLight);
        
        // Removed right-side fill light to prevent bright side lighting
        
        // Removed point lights to prevent bright side lighting on character
    }
    
    loadGLBModel(modelPath) {
        const loader = new GLTFLoader();
        
        loader.load(
            modelPath,
            (gltf) => {
                console.log('GLB model loaded successfully:', gltf);
                this.model = gltf.scene;
                
                // Enable shadows and improve materials for the model
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Improve material properties for better visibility
                        if (child.material) {
                            // Make materials more emissive and brighter
                            if (child.material.map) {
                                child.material.map.encoding = THREE.sRGBEncoding;
                            }
                            
                            // Increase material brightness significantly
                            if (child.material.color) {
                                child.material.color.multiplyScalar(1.5);
                            }
                            
                            // Make materials more emissive for extra brightness
                            if (child.material.emissive) {
                                child.material.emissive.multiplyScalar(0.3);
                            }
                            
                            // Remove glossy/reflective properties
                            child.material.roughness = 1.0; // Maximum roughness (no gloss)
                            child.material.metalness = 0.0; // No metallic properties
                            child.material.envMapIntensity = 0.0; // No environment reflections
                            
                            // Make materials more responsive to light
                            child.material.needsUpdate = true;
                        }
                    }
                });
                
                // Center the model
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                this.model.position.sub(center);
                
                // Scale the model to appropriate size for soccer field
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim; // Scale to appropriate character size
                this.model.scale.setScalar(scale);
                
                // Position character on the field
                this.model.position.set(0, 0, 0);
                
                // Set up animations
                this.setupAnimations(gltf);
                
                this.scene.add(this.model);
                
                // Update stats
                this.updateStats();
                
                // Hide loading screen
                this.hideLoadingScreen();
                
                console.log('Model added to scene with animations');
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading GLB model:', error);
                this.showError('Failed to load GLB model. Please check the file path and try again.');
            }
        );
    }
    
    setupAnimations(gltf) {
        if (gltf.animations && gltf.animations.length > 0) {
            console.log('Found animations:', gltf.animations.length);
            
            // Create animation mixer
            this.mixer = new THREE.AnimationMixer(this.model);
            
            // Store all animations
            this.animations = gltf.animations;
            
            // Play the first animation (usually idle)
            if (this.animations.length > 0) {
                const idleAction = this.mixer.clipAction(this.animations[0]);
                idleAction.play();
                console.log('Playing animation:', this.animations[0].name || 'Unnamed');
            }
            
            // If there are multiple animations, you can set up controls
            if (this.animations.length > 1) {
                console.log('Available animations:');
                this.animations.forEach((clip, index) => {
                    console.log(`${index}: ${clip.name || 'Unnamed'}`);
                });
            }
        } else {
            console.log('No animations found in GLB file');
        }
    }
    
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
    }
    
    handleKeyDown(event) {
        const moveSpeed = 0.5;
        
        switch(event.code) {
            case 'KeyW':
                this.camera.position.z -= moveSpeed;
                break;
            case 'KeyS':
                this.camera.position.z += moveSpeed;
                break;
            case 'KeyA':
                this.camera.position.x -= moveSpeed;
                break;
            case 'KeyD':
                this.camera.position.x += moveSpeed;
                break;
            case 'KeyQ':
                this.camera.position.y += moveSpeed;
                break;
            case 'KeyE':
                this.camera.position.y -= moveSpeed;
                break;
            case 'Digit1':
                this.playAnimation(0);
                break;
            case 'Digit2':
                this.playAnimation(1);
                break;
            case 'Digit3':
                this.playAnimation(2);
                break;
            case 'Digit4':
                this.playAnimation(3);
                break;
            case 'KeyL':
                this.toggleLighting();
                break;
        }
    }
    
    playAnimation(index) {
        if (this.mixer && this.animations && this.animations[index]) {
            // Stop all current animations
            this.mixer.stopAllAction();
            
            // Play the selected animation
            const action = this.mixer.clipAction(this.animations[index]);
            action.play();
            console.log('Playing animation:', this.animations[index].name || `Animation ${index}`);
        }
    }
    
    toggleLighting() {
        // Toggle between very bright and normal lighting
        const lights = this.scene.children.filter(child => child.isLight);
        
        lights.forEach(light => {
            if (light.intensity !== undefined) {
                if (light.intensity > 2.0) {
                    light.intensity *= 0.4; // Dim the lights significantly
                } else {
                    light.intensity *= 2.5; // Brighten the lights significantly
                }
            }
        });
        
        // Also toggle renderer exposure
        if (this.renderer.toneMappingExposure > 1.5) {
            this.renderer.toneMappingExposure = 1.0;
        } else {
            this.renderer.toneMappingExposure = 2.0;
        }
        
        console.log('Lighting toggled. Current exposure:', this.renderer.toneMappingExposure);
    }
    
    updateStats() {
        this.stats.objectCount = this.scene.children.length;
        this.stats.fps = Math.round(1 / this.clock.getDelta());
        
        document.getElementById('fps').textContent = this.stats.fps;
        document.getElementById('objectCount').textContent = this.stats.objectCount;
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    showError(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.innerHTML = `
            <h2 style="color: #ff6b6b;">Error</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
            ">Reload</button>
        `;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // Update controls
        this.controls.update();
        
        // Update stats
        this.updateStats();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new GLBGame();
        
        // Load your character GLB model
        game.loadGLBModel('character/Ch_idle-2.glb');
        
        // Make game globally accessible for debugging
        window.game = game;
        
        console.log('Soccer game initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        document.getElementById('loadingScreen').innerHTML = `
            <h2 style="color: #ff6b6b;">Error</h2>
            <p>Failed to initialize the game: ${error.message}</p>
            <p>Please check your internet connection and try again.</p>
            <button onclick="location.reload()" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
            ">Reload</button>
        `;
    }
});

// Drag and drop functionality
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
            const url = URL.createObjectURL(file);
            if (window.game) {
                // Clear existing model
                if (window.game.model) {
                    window.game.scene.remove(window.game.model);
                }
                window.game.loadGLBModel(url);
            }
        } else {
            alert('Please drop a GLB or GLTF file');
        }
    }
});
