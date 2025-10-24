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
        this.currentAnimation = null;
        this.goalPost = null;
        this.ball = null;
        this.isMoving = false;
        this.characterSpeed = 0.5;
        this.pressedKeys = new Set();
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
        // Position camera further back to allow for zoom range
        this.camera.position.set(0, 6, -40); // Zoomed out a bit more
        this.camera.lookAt(0, 0, -90); // Look towards the goal post area
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
        this.controls.maxDistance = 300;
        this.controls.minDistance = 3;
        // Set the target to the goal post location so zoom focuses on the goal
        this.controls.target.set(0, 0,-90);
    }
    
    createSoccerField() {
        // Create grass field (3x bigger, extended to cover goal posts)
        const fieldGeometry = new THREE.PlaneGeometry(120, 200);
        const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.rotation.x = -Math.PI / 2;
        field.receiveShadow = true;
        this.scene.add(field);
        
        // Create field lines
        this.createFieldLines();
        
        // Create center circle
        this.createCenterCircle();
    }
    
    createFieldLines() {
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        
        // Field boundary (3x bigger, extended to cover goal posts)
        const boundaryGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-60, 0.01, -100),
            new THREE.Vector3(60, 0.01, -100),
            new THREE.Vector3(60, 0.01, 100),
            new THREE.Vector3(-60, 0.01, 100),
            new THREE.Vector3(-60, 0.01, -100)
        ]);
        const boundary = new THREE.Line(boundaryGeometry, lineMaterial);
        this.scene.add(boundary);
        
        // Center line (3x bigger)
        const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-60, 0.01, 0),
            new THREE.Vector3(60, 0.01, 0)
        ]);
        const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
        this.scene.add(centerLine);
        
        // Goal areas (3x bigger, extended to cover goal posts)
        const goalAreaGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-18, 0.01, -100),
            new THREE.Vector3(18, 0.01, -100),
            new THREE.Vector3(18, 0.01, -72),
            new THREE.Vector3(-18, 0.01, -72),
            new THREE.Vector3(-18, 0.01, -100)
        ]);
        const goalArea1 = new THREE.Line(goalAreaGeometry, lineMaterial);
        this.scene.add(goalArea1);
        
        const goalArea2Geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-18, 0.01, 100),
            new THREE.Vector3(18, 0.01, 100),
            new THREE.Vector3(18, 0.01, 72),
            new THREE.Vector3(-18, 0.01, 72),
            new THREE.Vector3(-18, 0.01, 100)
        ]);
        const goalArea2 = new THREE.Line(goalArea2Geometry, lineMaterial);
        this.scene.add(goalArea2);
    }
    
    createCenterCircle() {
        const circleGeometry = new THREE.RingGeometry(27.45, 27.75, 32); // 3x bigger
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
                // Position character in penalty area near goal (like in the image)
                this.model.position.set(-7, 0, -50);
                // Rotate character to face the goal (net)
                this.model.rotation.y = Math.PI; // 180 degrees to face the goal
                
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
    
    loadGoalPost() {
        const loader = new GLTFLoader();
        const timestamp = Date.now();
        
        loader.load(
            `character/goal.glb?v=${timestamp}`,
            (gltf) => {
                console.log('Goal post loaded successfully');
                
                // Position the goal post in the scene (3x bigger field)
                const goalPost = gltf.scene;
                goalPost.position.set(0, 0, -90); // Position at new field boundary (3x bigger)
                goalPost.rotation.y = Math.PI; // Rotate 180 degrees to face the character
                goalPost.scale.set(4.5, 4.5, 4.5); // Scale 4.5x bigger (3x field × 1.5x goal)
                
                // Enable shadows for the goal post
                goalPost.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Add to scene
                this.scene.add(goalPost);
                
                // Store reference for future use
                this.goalPost = goalPost;
                
                console.log('Goal post added to scene');
            },
            (progress) => {
                const percentComplete = (progress.loaded / progress.total) * 100;
                console.log('Goal loading progress:', percentComplete.toFixed(2) + '%');
            },
            (error) => {
                console.error('Error loading goal post:', error);
            }
        );
    }
    
    loadBall() {
        const loader = new GLTFLoader();
        const timestamp = Date.now();
        
        loader.load(
            `character/ball.glb?v=${timestamp}`,
            (gltf) => {
                console.log('Ball loaded successfully');
                
                // Position the ball on the field
                const ball = gltf.scene;
                ball.position.set(-3.9, 0, -56.25); // Position in front of the character
                ball.scale.set(5, 5, 5); // 5 times bigger
                
                // Enable shadows for the ball
                ball.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Add to scene
                this.scene.add(ball);
                
                // Store reference for future use
                this.ball = ball;
                
                console.log('Ball added to scene');
            },
            (progress) => {
                const percentComplete = (progress.loaded / progress.total) * 100;
                console.log('Ball loading progress:', percentComplete.toFixed(2) + '%');
            },
            (error) => {
                console.error('Error loading ball:', error);
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
            
            // Find idle, running, and kick animations by name
            this.idleAnimation = this.findAnimationByName(['idle', 'Idle', 'IDLE', 'standing', 'Standing']);
            this.runningAnimation = this.findAnimationByName(['run', 'Run', 'RUN', 'running', 'Running', 'RUNNING']);
            this.kickAnimation = this.findAnimationByName(['kick', 'Kick', 'KICK', 'kicking', 'Kicking', 'KICKING']);
            
            // If we can't find by name, use index-based approach
            if (!this.idleAnimation && this.animations.length > 0) {
                this.idleAnimation = this.animations[0]; // First animation as idle
            }
            if (!this.runningAnimation && this.animations.length > 1) {
                this.runningAnimation = this.animations[1]; // Second animation as running
            }
            if (!this.kickAnimation && this.animations.length > 2) {
                this.kickAnimation = this.animations[2]; // Third animation as kick
            }
            
            // Start with idle animation
            if (this.idleAnimation) {
                this.currentAnimation = this.mixer.clipAction(this.idleAnimation);
                this.currentAnimation.play();
                this.currentAnimation.setEffectiveTimeScale(1.0);
                console.log('Playing idle animation:', this.idleAnimation.name || 'Unnamed');
            }
            
            // Log all available animations
            console.log('Available animations:');
            this.animations.forEach((clip, index) => {
                const type = clip === this.idleAnimation ? ' (IDLE)' : 
                           clip === this.runningAnimation ? ' (RUNNING)' :
                           clip === this.kickAnimation ? ' (KICK)' : '';
                console.log(`${index}: ${clip.name || 'Unnamed'}${type}`);
            });
            
            console.log('Idle animation:', this.idleAnimation?.name || 'Not found');
            console.log('Running animation:', this.runningAnimation?.name || 'Not found');
            console.log('Kick animation:', this.kickAnimation?.name || 'Not found');
        } else {
            console.log('No animations found in GLB file');
        }
    }
    
    findAnimationByName(names) {
        for (const name of names) {
            const animation = this.animations.find(clip => 
                clip.name && clip.name.toLowerCase().includes(name.toLowerCase())
            );
            if (animation) return animation;
        }
        return null;
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
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
    }
    
    handleKeyDown(event) {
        this.pressedKeys.add(event.code);
        
        const cameraMoveSpeed = 0.5;
        
        switch(event.code) {
            // Character position fine-tuning (with Shift key)
            case 'KeyW':
                if (event.shiftKey) {
                    this.model.position.z -= 0.5; // Move character forward
                    console.log('Character position:', this.model.position);
                    return; // Prevent regular movement
                } else if (event.altKey) {
                    this.camera.position.z -= 0.5; // Move camera forward
                    console.log('Camera position:', this.camera.position);
                    return; // Prevent regular movement
                }
                break;
            case 'KeyS':
                if (event.shiftKey) {
                    this.model.position.z += 0.5; // Move character backward
                    console.log('Character position:', this.model.position);
                    return; // Prevent regular movement
                } else if (event.altKey) {
                    this.camera.position.z += 0.5; // Move camera backward
                    console.log('Camera position:', this.camera.position);
                    return; // Prevent regular movement
                }
                break;
            case 'KeyA':
                if (event.shiftKey) {
                    this.model.position.x -= 0.5; // Move character left
                    console.log('Character position:', this.model.position);
                    return; // Prevent regular movement
                } else if (event.altKey) {
                    this.camera.position.x -= 0.5; // Move camera left
                    console.log('Camera position:', this.camera.position);
                    return; // Prevent regular movement
                }
                break;
            case 'KeyD':
                if (event.shiftKey) {
                    this.model.position.x += 0.5; // Move character right
                    console.log('Character position:', this.model.position);
                    return; // Prevent regular movement
                } else if (event.altKey) {
                    this.camera.position.x += 0.5; // Move camera right
                    console.log('Camera position:', this.camera.position);
                    return; // Prevent regular movement
                }
                break;
            case 'KeyQ':
                if (event.shiftKey) {
                    this.model.rotation.y -= 0.1; // Rotate character left
                    console.log('Character rotation:', this.model.rotation.y);
                    return; // Prevent regular movement
                } else if (event.altKey) {
                    this.camera.position.y += 0.5; // Move camera up
                    console.log('Camera position:', this.camera.position);
                    return; // Prevent regular movement
                }
                break;
            case 'KeyE':
                if (event.shiftKey) {
                    this.model.rotation.y += 0.1; // Rotate character right
                    console.log('Character rotation:', this.model.rotation.y);
                    return; // Prevent regular movement
                } else if (event.altKey) {
                    this.camera.position.y -= 0.5; // Move camera down
                    console.log('Camera position:', this.camera.position);
                    return; // Prevent regular movement
                }
                break;
            // Animation controls
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
            case 'Space':
                this.playKickAnimation();
                break;
            case 'KeyL':
                this.toggleLighting();
                break;
        }
    }
    
    handleKeyUp(event) {
        this.pressedKeys.delete(event.code);
        
        // Check if any movement keys are still pressed
        const movementKeys = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];
        const anyMovementKeyPressed = movementKeys.some(key => this.pressedKeys.has(key));
        
        if (!anyMovementKeyPressed && this.isMoving) {
            this.isMoving = false;
            console.log('All movement keys released, switching to idle');
            this.switchToIdleAnimation();
        }
    }
    
    handleContinuousMovement(deltaTime) {
        if (!this.model) return;
        
        const moveSpeed = this.characterSpeed * deltaTime * 60; // Scale by deltaTime and 60fps
        let deltaX = 0;
        let deltaZ = 0;
        
        // Check which movement keys are currently pressed
        if (this.pressedKeys.has('KeyW')) {
            deltaZ -= moveSpeed;
        }
        if (this.pressedKeys.has('KeyS')) {
            deltaZ += moveSpeed;
        }
        if (this.pressedKeys.has('KeyA')) {
            deltaX -= moveSpeed;
        }
        if (this.pressedKeys.has('KeyD')) {
            deltaX += moveSpeed;
        }
        
        // Debug: Log pressed keys and movement state
        if (this.pressedKeys.size > 0) {
            console.log('Pressed keys:', Array.from(this.pressedKeys), 'deltaX:', deltaX, 'deltaZ:', deltaZ, 'isMoving:', this.isMoving);
        }
        
        // Only move if any movement keys are pressed
        if (deltaX !== 0 || deltaZ !== 0) {
            this.moveCharacter(deltaX, deltaZ);
            // Switch to running animation when moving
            if (!this.isMoving) {
                this.isMoving = true;
                console.log('Started moving, switching to running');
                this.switchToRunningAnimation();
            }
        } else {
            // No movement keys pressed
            if (this.isMoving) {
                this.isMoving = false;
                console.log('Stopped moving, switching to idle');
                this.switchToIdleAnimation();
            }
        }
    }
    
    moveCharacter(deltaX, deltaZ) {
        if (!this.model) {
            console.log('No model found for movement');
            return;
        }
        
        // Move the character
        this.model.position.x += deltaX;
        this.model.position.z += deltaZ;
        
        // Keep character within field bounds (3x bigger field: 120x200)
        this.model.position.x = Math.max(-60, Math.min(60, this.model.position.x));
        this.model.position.z = Math.max(-100, Math.min(100, this.model.position.z));
        
        // Rotate character to face movement direction
        if (deltaX !== 0 || deltaZ !== 0) {
            const angle = Math.atan2(deltaX, deltaZ);
            this.model.rotation.y = angle;
        }
        
    }
    
    switchToRunningAnimation() {
        console.log('switchToRunningAnimation called');
        if (this.mixer && this.runningAnimation) {
            // Fade out current animation if it exists
            if (this.currentAnimation) {
                this.currentAnimation.fadeOut(0.1);
            }
            
            // Create and play running animation
            const runningAction = this.mixer.clipAction(this.runningAnimation);
            runningAction.reset();
            runningAction.setLoop(THREE.LoopRepeat);
            runningAction.setEffectiveTimeScale(2.0); // Make running animation twice as fast
            runningAction.fadeIn(0.1);
            runningAction.play();
            
            this.currentAnimation = runningAction;
            console.log('Switched to running animation:', this.runningAnimation.name || 'Unnamed');
        } else {
            console.log('No running animation available - mixer:', !!this.mixer, 'runningAnimation:', !!this.runningAnimation);
        }
    }
    
    switchToIdleAnimation() {
        console.log('switchToIdleAnimation called');
        if (this.mixer && this.idleAnimation) {
            // Fade out current animation if it exists
            if (this.currentAnimation) {
                this.currentAnimation.fadeOut(0.1);
            }
            
            // Create and play idle animation
            const idleAction = this.mixer.clipAction(this.idleAnimation);
            idleAction.reset();
            idleAction.setLoop(THREE.LoopRepeat);
            idleAction.fadeIn(0.1);
            idleAction.play();
            
            this.currentAnimation = idleAction;
            console.log('Switched to idle animation:', this.idleAnimation.name || 'Unnamed');
        } else {
            console.log('No idle animation available - mixer:', !!this.mixer, 'idleAnimation:', !!this.idleAnimation);
        }
    }
    
    playKickAnimation() {
        if (this.mixer && this.kickAnimation) {
            // Stop current animation
            if (this.currentAnimation) {
                this.currentAnimation.stop();
            }
            
            // Play kick animation (no loop, plays once)
            this.currentAnimation = this.mixer.clipAction(this.kickAnimation);
            this.currentAnimation.reset();
            this.currentAnimation.setLoop(THREE.LoopOnce);
            this.currentAnimation.play();
            console.log('Playing kick animation:', this.kickAnimation.name || 'Unnamed');
            
            // Return to idle after kick animation finishes
            this.currentAnimation.clampWhenFinished = true;
            this.currentAnimation.addEventListener('finished', () => {
                // Update the character's position after the kick animation
                // This ensures WASD movement uses the new position as reference
                console.log('Kick animation finished, character position updated');
                this.switchToIdleAnimation();
            });
        } else {
            console.log('No kick animation available');
        }
    }
    
    playAnimation(index) {
        if (this.mixer && this.animations && this.animations[index]) {
            // Stop all current animations
            this.mixer.stopAllAction();
            
            // Play the selected animation
            const action = this.mixer.clipAction(this.animations[index]);
            action.play();
            action.setEffectiveTimeScale(1.0); // Reset to normal speed
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
        
        // Handle continuous movement
        this.handleContinuousMovement(deltaTime);
        
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
        
        // Load your character GLB model with all animations
        game.loadGLBModel('character/ch_animations.glb');
        
        // Load the goal post
        game.loadGoalPost();
        
        // Load the ball
        game.loadBall();
        
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
