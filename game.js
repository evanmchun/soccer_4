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
        this.ballVelocity = new THREE.Vector3(0, 0, 0);
        this.ballAcceleration = new THREE.Vector3(0, 0, 0);
        this.ballFriction = 0.98;
        this.ballGravity = -0.005;
        this.ballKicked = false;
        this.ballStopTimer = 0;
        this.goalScored = false;
        this.isMoving = false;
        this.characterSpeed = 0.5;
        this.pressedKeys = new Set();
        this.clock = new THREE.Clock();
        this.frameCount = 0;
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
        // Create grass field (extended to fully cover goal posts and collision area)
        const fieldGeometry = new THREE.PlaneGeometry(120, 250);
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
        
        // Field boundary (extended to fully cover goal posts and collision area)
        const boundaryGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-60, 0.01, -125),
            new THREE.Vector3(60, 0.01, -125),
            new THREE.Vector3(60, 0.01, 125),
            new THREE.Vector3(-60, 0.01, 125),
            new THREE.Vector3(-60, 0.01, -125)
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
        
        // Goal areas (extended to fully cover goal posts and collision area)
        const goalAreaGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-18, 0.01, -125),
            new THREE.Vector3(18, 0.01, -125),
            new THREE.Vector3(18, 0.01, -97),
            new THREE.Vector3(-18, 0.01, -97),
            new THREE.Vector3(-18, 0.01, -125)
        ]);
        const goalArea1 = new THREE.Line(goalAreaGeometry, lineMaterial);
        this.scene.add(goalArea1);
        
        const goalArea2Geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-18, 0.01, 125),
            new THREE.Vector3(18, 0.01, 125),
            new THREE.Vector3(18, 0.01, 97),
            new THREE.Vector3(-18, 0.01, 97),
            new THREE.Vector3(-18, 0.01, 125)
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
                
                // Position the goal post in the scene (purely visual, no collision)
                const goalPost = gltf.scene;
                goalPost.position.set(0, 0, -90); // Position at new field boundary (3x bigger)
                goalPost.rotation.y = Math.PI; // Rotate 180 degrees to face the character
                goalPost.scale.set(4.5, 4.5, 4.5); // Scale 4.5x bigger (3x field × 1.5x goal)
                
                // Enable shadows for the goal post and ensure no collision
                goalPost.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Ensure no collision detection
                        child.userData = { noCollision: true };
                    }
                });
                
                // Hide the goalpost to prevent interaction
                goalPost.visible = false;
                
                // Add to scene (but hidden)
                this.scene.add(goalPost);
                
                // Store reference for future use
                this.goalPost = goalPost;
                
                // Add red wireframe box to show goal collision area
                this.createGoalCollisionVisualizer();
                
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
    
    createGoalCollisionVisualizer() {
        // Create a red wireframe box to show the goal collision area
        const goalCenterZ = -109; // Moved a bit closer to player (was -111)
        const goalWidth = 33; // Match the collision detection width (updated)
        const goalHeight = 11; // Match the collision detection height (updated)
        const goalDepth = 8; // Depth of the red box
        
        // Create wireframe box geometry
        const boxGeometry = new THREE.BoxGeometry(goalWidth, goalHeight, goalDepth);
        const boxMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Red color
            wireframe: true, // Wireframe mode
            transparent: true,
            opacity: 0.8
        });
        
        const collisionBox = new THREE.Mesh(boxGeometry, boxMaterial);
        collisionBox.position.set(0, goalHeight / 2, goalCenterZ); // Center the box
        
        // Add to scene
        this.scene.add(collisionBox);
        
        // Store reference for potential removal later
        this.goalCollisionVisualizer = collisionBox;
        
        console.log('Goal collision visualizer added - Red wireframe box');
        console.log('Collision bounds - X: ±16.5, Y: 0-11, Z: -104 to -96');
    }
    
    kickBall() {
        if (!this.ball) return;
        
        console.log('Kicking ball towards goal!');
        console.log('Ball starting position:', this.ball.position);
        
        // Ball starts at (-3.9, 0, -56.25), goal is at z = -90
        // Need to travel about 34 units forward to reach goal
        
        // Target deeper into the collision box - closer to the back boundary
        const collisionBoxCenterZ = -111; // Target deeper into the box (was -109, now closer to back at -113)
        const collisionBoxCenterY = 5; // Middle height of collision box
        
        // Randomly choose between center, middle right, or middle left
        const targetOptions = [
            { x: 0, name: 'center' },      // Center
            { x: 9, name: 'middle right' }, // Middle right
            { x: -9, name: 'middle left' }  // Middle left
        ];
        
        const selectedTarget = targetOptions[Math.floor(Math.random() * targetOptions.length)];
        console.log('Selected target:', selectedTarget.name);
        
        // Small random variations around the selected target - reduced for more precision
        const randomX = selectedTarget.x + (Math.random() - 0.5) * 1; // ±0.5 unit around target (well within ±16.5)
        const randomY = collisionBoxCenterY + (Math.random() - 0.5) * 0.5; // ±0.25 units up/down (well within 0-11)
        const randomZ = collisionBoxCenterZ + (Math.random() - 0.5) * 0.5; // ±0.25 units around the deeper target point
        
        const targetPosition = new THREE.Vector3(randomX, randomY, randomZ);
        console.log('Target position:', targetPosition);
        
        // Calculate direction from ball to target
        const direction = new THREE.Vector3();
        direction.subVectors(targetPosition, this.ball.position);
        direction.normalize();
        
        console.log('Direction vector:', direction);
        
        // Set velocity with enough power to reach the back of collision box
        const kickPower = 2.3; // Fine-tuned ball speed
        this.ballVelocity.set(
            direction.x * kickPower,
            direction.y * kickPower + 0.3, // Slightly higher trajectory
            direction.z * kickPower
        );
        
        this.ballKicked = true;
        console.log('Ball velocity set:', this.ballVelocity);
    }
    
    updateBallPhysics() {
        if (!this.ball || (!this.ballKicked && !this.goalScored)) {
            this.ballStopTimer = 0;
            return;
        }
        
        // Debug: Track ball state at start of physics update
        if (this.ballKicked && !this.goalScored) {
            // Only log every 10 frames to reduce spam, but always log when near goal
            if (this.frameCount % 10 === 0 || this.ball.position.z < -80) {
                console.log('PHYSICS UPDATE - Ball state:', {
                    position: this.ball.position,
                    velocity: this.ballVelocity,
                    velocityLength: this.ballVelocity.length(),
                    ballKicked: this.ballKicked,
                    goalScored: this.goalScored,
                    ballStopTimer: this.ballStopTimer
                });
            }
        }
        
        // Handle goal celebration
        if (this.goalScored) {
            // Apply gravity to make ball fall
            this.ballVelocity.y += this.ballGravity;
            
            // Update ball position
            this.ball.position.add(this.ballVelocity);
            
            // Check if ball hit the ground
            if (this.ball.position.y <= 0.5) {
                this.ball.position.y = 0.5;
                this.ballVelocity.y = 0; // Stop falling
                console.log('Ball landed on ground at position:', this.ball.position);
            }
            
            // Ball stays in goal area permanently until R key is pressed
            // No automatic reset - ball will stay there until manual reset
            return;
        }
        
        // Apply gravity
        this.ballVelocity.y += this.ballGravity;
        
        // Apply friction
        this.ballVelocity.multiplyScalar(this.ballFriction);
        
        // Update ball position
        this.ball.position.add(this.ballVelocity);
        
        // CRITICAL: Apply boundary constraints BEFORE checking goal area
        // This prevents the ball from exiting the goal area before constraints are applied
        // DISABLED: This was causing ball teleporting by snapping positions
        // this.applyGoalAreaBoundaryConstraints();
        
        // Check if ball is in the goal area and apply slowing effect
        const inGoalArea = this.checkGoalArea();
        if (inGoalArea && !this.goalScored) {
            console.log('*** BALL ENTERED GOAL AREA *** - applying slowing effect. Position:', this.ball.position);
            console.log('Goal area boundaries: X: ±16.5, Y: 0-11, Z: -113 to -105');
            this.handleGoalArea();
        } else if (!inGoalArea && this.ballKicked && !this.goalScored) {
            console.log('Ball NOT in goal area. Position:', this.ball.position);
        }
        
        // CRITICAL SAFETY CHECK: If ball was ever in goal area, ensure it cannot escape
        // DISABLED: This was causing ball teleporting by snapping positions
        // if (this.goalScored) {
        //     this.ensureBallCannotEscape();
        // }
        
        // Check if ball hit the ground
        if (this.ball.position.y <= 0.5) {
            this.ball.position.y = 0.5;
            this.ballVelocity.y *= -0.6; // Bounce with reduced energy
            this.ballVelocity.x *= 0.8;  // Reduce horizontal speed on bounce
            this.ballVelocity.z *= 0.8;
            
            // Don't reset ball immediately after first bounce
            if (this.ballVelocity.length() < 0.1) {
                this.ballStopTimer += 1;
            } else {
                this.ballStopTimer = 0; // Reset timer if ball is still moving
            }
        } else {
            this.ballStopTimer = 0; // Reset timer if ball is in air
        }
        
        // Ball stop timer removed - ball will not auto-reset when stopped
        
        // Reset ball if it goes too far (but not during goal celebration or when in goal area)
        // Allow ball to go to z = -120 to reach the back of collision box (z = -113)
        // Be more lenient with X boundaries since goal area is only 33 units wide
        if (!this.goalScored && !inGoalArea && (this.ball.position.z < -120 || this.ball.position.z > 100 || 
            this.ball.position.x < -50 || this.ball.position.x > 50)) {
            console.log('*** BALL WENT TOO FAR - RESETTING ***');
            console.log('Ball position:', this.ball.position);
            console.log('goalScored:', this.goalScored, 'inGoalArea:', inGoalArea);
            console.log('Boundary check - Z:', this.ball.position.z, 'X:', this.ball.position.x);
            console.log('Z limits: -120 to 100, X limits: -50 to 50');
            this.resetBall(); // This will also reset character
        }
    }
    
    applyGoalAreaBoundaryConstraints() {
        if (!this.ball) return;
        
        // Goal area dimensions (same as the red collision box)
        const goalCenterZ = -109; // Moved a bit closer to player (was -111)
        const goalWidth = 33; // Width of the red box
        const goalHeight = 11; // Height of the red box
        const goalDepth = 8; // Depth of the red box (z = -113 to -105)
        
        // Constrain ball position to stay within the red box boundaries
        const minX = -goalWidth / 2;  // -16.5
        const maxX = goalWidth / 2;   // 16.5
        const minY = 0;
        const maxY = goalHeight;      // 11
        const minZ = goalCenterZ - goalDepth / 2;  // -113
        const maxZ = goalCenterZ + goalDepth / 2;  // -105
        
        // Only apply constraints if ball is near the goal area (to avoid affecting ball elsewhere)
        if (this.ball.position.z < -80) {
            console.log('APPLYING BOUNDARY CONSTRAINTS - Ball position:', this.ball.position);
            console.log('APPLYING BOUNDARY CONSTRAINTS - Boundaries: X:', minX, 'to', maxX, 'Y:', minY, 'to', maxY, 'Z:', minZ, 'to', maxZ);
            
            // CRITICAL: Keep ball within X boundaries - ball CANNOT escape
            if (this.ball.position.x < minX) {
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit left boundary at x =', this.ball.position.x, 'constraining to', minX);
                this.ball.position.x = minX;
                this.ballVelocity.x = 0; // Stop horizontal movement completely
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to left boundary - CANNOT ESCAPE');
            } else if (this.ball.position.x > maxX) {
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit right boundary at x =', this.ball.position.x, 'constraining to', maxX);
                this.ball.position.x = maxX;
                this.ballVelocity.x = 0; // Stop horizontal movement completely
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to right boundary - CANNOT ESCAPE');
            }
            
            // CRITICAL: Keep ball within Y boundaries - ball CANNOT escape
            if (this.ball.position.y < minY) {
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit bottom boundary at y =', this.ball.position.y, 'constraining to', minY);
                this.ball.position.y = minY;
                this.ballVelocity.y = 0; // Stop vertical movement completely
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to bottom boundary - CANNOT ESCAPE');
            } else if (this.ball.position.y > maxY) {
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit top boundary at y =', this.ball.position.y, 'constraining to', maxY);
                this.ball.position.y = maxY;
                this.ballVelocity.y = 0; // Stop vertical movement completely
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to top boundary - CANNOT ESCAPE');
            }
            
            // CRITICAL: Keep ball within Z boundaries - ball CANNOT escape the box
            if (this.ball.position.z < minZ) {
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit back boundary at z =', this.ball.position.z, 'constraining to', minZ);
                this.ball.position.z = minZ;
                this.ballVelocity.z = 0; // Stop forward movement completely
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to back boundary - CANNOT ESCAPE');
            } else if (this.ball.position.z > maxZ) {
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit front boundary at z =', this.ball.position.z, 'constraining to', maxZ);
                this.ball.position.z = maxZ;
                this.ballVelocity.z = 0; // Stop backward movement completely
                console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to front boundary - CANNOT ESCAPE');
            }
        }
    }
    
    checkGoalArea() {
        if (!this.ball || !this.goalPost) return false;
        
        // Goal area dimensions (same as the red collision box)
        const goalCenterZ = -109; // Moved a bit closer to player (was -111)
        const goalWidth = 33; // Width of the red box
        const goalHeight = 11; // Height of the red box
        const goalDepth = 8; // Depth of the red box (z = -113 to -105)
        
        const ballPos = this.ball.position;
        
        // Check if ball is in the goal area (overlapping zone)
        const inGoalX = Math.abs(ballPos.x) <= goalWidth / 2;
        const inGoalY = ballPos.y >= 0 && ballPos.y <= goalHeight;
        const inGoalZ = ballPos.z >= goalCenterZ - goalDepth/2 && ballPos.z <= goalCenterZ + goalDepth/2;
        
        // Debug logging
        if (ballPos.z < -85) { // Only log when ball is close to goal
            console.log('Ball near goal - Position:', ballPos);
            console.log('Goal area check - X:', inGoalX, 'Y:', inGoalY, 'Z:', inGoalZ);
            console.log('Goal area bounds - X: ±16.5, Y: 0-11, Z: -113 to -105');
            if (inGoalX && inGoalY && inGoalZ) {
                console.log('*** BALL IS IN GOAL AREA ***');
            }
        }
        
        return inGoalX && inGoalY && inGoalZ;
    }
    
    handleGoalArea() {
        // Goal area boundaries (same as red collision box)
        const goalCenterZ = -109; // Moved a bit closer to player (was -111)
        const goalWidth = 33;
        const goalHeight = 11;
        const goalDepth = 8; // Depth of the red box
        
        // Apply extreme slowing effect when ball is in the goal area
        const slowFactor = 0.7; // Reduce velocity by 30% each frame (brings ball to near-zero velocity)
        
        // Apply slowing to all velocity components
        this.ballVelocity.multiplyScalar(slowFactor);
        
        // Constrain ball position to stay within the red box boundaries
        const minX = -goalWidth / 2;  // -16.5
        const maxX = goalWidth / 2;   // 16.5
        const minY = 0;
        const maxY = goalHeight;      // 11
        const minZ = goalCenterZ - goalDepth / 2;  // -113
        const maxZ = goalCenterZ + goalDepth / 2;  // -105
        
        console.log('HANDLE GOAL AREA - Ball position:', this.ball.position);
        console.log('HANDLE GOAL AREA - Boundaries: X:', minX, 'to', maxX, 'Y:', minY, 'to', maxY, 'Z:', minZ, 'to', maxZ);
        console.log('HANDLE GOAL AREA - Ball Z position:', this.ball.position.z, 'minZ:', minZ, 'maxZ:', maxZ);
        console.log('HANDLE GOAL AREA - Z boundary check: ball.z < minZ?', this.ball.position.z < minZ, 'ball.z > maxZ?', this.ball.position.z > maxZ);
        
        // CRITICAL: Keep ball within X boundaries - ball CANNOT escape
        if (this.ball.position.x < minX) {
            console.log('Ball hit left boundary at x =', this.ball.position.x, 'constraining to', minX);
            this.ball.position.x = minX;
            this.ballVelocity.x = 0; // Stop horizontal movement completely
            console.log('Ball constrained to left boundary - CANNOT ESCAPE');
        } else if (this.ball.position.x > maxX) {
            console.log('Ball hit right boundary at x =', this.ball.position.x, 'constraining to', maxX);
            this.ball.position.x = maxX;
            this.ballVelocity.x = 0; // Stop horizontal movement completely
            console.log('Ball constrained to right boundary - CANNOT ESCAPE');
        }
        
        // CRITICAL: Keep ball within Y boundaries - ball CANNOT escape
        if (this.ball.position.y < minY) {
            this.ball.position.y = minY;
            this.ballVelocity.y = 0; // Stop vertical movement completely
            console.log('Ball constrained to bottom boundary - CANNOT ESCAPE');
        } else if (this.ball.position.y > maxY) {
            this.ball.position.y = maxY;
            this.ballVelocity.y = 0; // Stop vertical movement completely
            console.log('Ball constrained to top boundary - CANNOT ESCAPE');
        }
        
        // CRITICAL: Keep ball within Z boundaries - ball CANNOT escape the box
        if (this.ball.position.z < minZ) {
            console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit back boundary at z =', this.ball.position.z, 'constraining to', minZ);
            this.ball.position.z = minZ;
            this.ballVelocity.z = 0; // Stop forward movement completely
            console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to back boundary - CANNOT ESCAPE');
        } else if (this.ball.position.z > maxZ) {
            console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit front boundary at z =', this.ball.position.z, 'constraining to', maxZ);
            this.ball.position.z = maxZ;
            this.ballVelocity.z = 0; // Stop backward movement completely
            console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to front boundary - CANNOT ESCAPE');
        } else {
            console.log('Ball Z position is within boundaries, no constraint needed');
        }
        
        // Check if ball has slowed down enough to consider it "scored"
        if (this.ballVelocity.length() < 0.1 && !this.goalScored) {
            console.log('GOAL SCORED: Ball has slowed down enough in goal area!');
            console.log('Ball velocity:', this.ballVelocity.length(), 'Position:', this.ball.position);
            
            // Set goal scored flag
            this.goalScored = true;
            
            // Stop the ball completely
            this.ballVelocity.set(0, 0, 0);
            
            // Position ball on the ground in the goal area
            this.ball.position.y = 0.5;
            
            console.log('Goal scored! Ball will stay in goal area until R is pressed');
            console.log('goalScored flag set to:', this.goalScored);
        }
    }
    
    ensureBallCannotEscape() {
        // CRITICAL: Double-check that ball cannot escape the boundary box
        const goalCenterZ = -109;
        const goalWidth = 33;
        const goalHeight = 11;
        const goalDepth = 8;
        
        const minX = -goalWidth / 2;  // -16.5
        const maxX = goalWidth / 2;   // 16.5
        const minY = 0;
        const maxY = goalHeight;      // 11
        const minZ = goalCenterZ - goalDepth / 2;  // -113
        const maxZ = goalCenterZ + goalDepth / 2;  // -105
        
        // Force ball to stay within boundaries - NO EXCEPTIONS
        if (this.ball.position.x < minX) {
            console.log('SAFETY: Ball at x =', this.ball.position.x, 'forced back to left boundary', minX);
            this.ball.position.x = minX;
            this.ballVelocity.x = 0;
            console.log('SAFETY: Ball forced back to left boundary');
        } else if (this.ball.position.x > maxX) {
            console.log('SAFETY: Ball at x =', this.ball.position.x, 'forced back to right boundary', maxX);
            this.ball.position.x = maxX;
            this.ballVelocity.x = 0;
            console.log('SAFETY: Ball forced back to right boundary');
        }
        
        if (this.ball.position.y < minY) {
            this.ball.position.y = minY;
            this.ballVelocity.y = 0;
            console.log('SAFETY: Ball forced back to bottom boundary');
        } else if (this.ball.position.y > maxY) {
            this.ball.position.y = maxY;
            this.ballVelocity.y = 0;
            console.log('SAFETY: Ball forced back to top boundary');
        }
        
        if (this.ball.position.z < minZ) {
            this.ball.position.z = minZ;
            this.ballVelocity.z = 0;
            console.log('SAFETY: Ball forced back to back boundary');
        } else if (this.ball.position.z > maxZ) {
            this.ball.position.z = maxZ;
            this.ballVelocity.z = 0;
            console.log('SAFETY: Ball forced back to front boundary');
        }
    }
    
    resetBall() {
        if (!this.ball) return;
        
        console.log('=== RESET BALL CALLED ===');
        console.log('Current ball position:', this.ball.position);
        console.log('Current ball velocity:', this.ballVelocity);
        console.log('goalScored flag:', this.goalScored);
        console.log('ballKicked flag:', this.ballKicked);
        console.log('ballStopTimer:', this.ballStopTimer);
        
        this.ball.position.set(-3.9, 0, -56.25); // Start on the ground (y = 0)
        this.ballVelocity.set(0, 0, 0);
        this.ballKicked = false;
        this.ballStopTimer = 0;
        this.goalScored = false;
        
        console.log('Ball reset complete - new position:', this.ball.position);
        console.log('=== RESET BALL COMPLETE ===');
        
        // Also reset character immediately when ball resets
        this.resetCharacter();
    }
    
    resetCharacter() {
        if (!this.model) {
            console.log('Cannot reset character - model not found');
            return;
        }
        
        console.log('Resetting character to original position');
        console.log('Character current position:', this.model.position);
        this.model.position.set(-7, 0, -50); // Match the original starting position
        this.model.rotation.y = Math.PI; // Face the goal
        console.log('Character new position:', this.model.position);
    }
    
    resetGame() {
        console.log('Resetting game - ball and character to original positions');
        this.resetBall();
        this.resetCharacter();
    }
    
    loadBall() {
        console.log('Creating sphere ball for testing');
        
        // Create a simple sphere for testing
        const ballGeometry = new THREE.SphereGeometry(1, 16, 16);
        const ballMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff, // White color
            transparent: true,
            opacity: 0.9
        });
        
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.set(-3.9, 0, -56.25); // Position in front of the character, on the ground (y = 0)
        ball.scale.set(2, 2, 2); // Make it a bit bigger for visibility
                
                // Enable shadows for the ball
        ball.castShadow = true;
        ball.receiveShadow = true;
                
                // Add to scene
                this.scene.add(ball);
                
                // Store reference for future use
                this.ball = ball;
                
        console.log('Sphere ball added to scene');
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
        console.log('Setting up event listeners...');
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            console.log('Keydown event received:', event.code);
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        console.log('Event listeners set up successfully');
    }
    
    handleKeyDown(event) {
        console.log('Key pressed:', event.code);
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
            case 'KeyR':
                if (this.goalScored) {
                    console.log('Resetting ball from goal area');
                    this.goalScored = false;
                    this.resetBall();
                } else {
                    console.log('Kick ball triggered by R key');
                    this.playKickAnimation();
                }
                break;
            case 'KeyT':
                console.log('Test reset - calling resetBall directly');
                this.resetBall();
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
            
            // Kick the ball towards the goal after a 0.75-second delay
            setTimeout(() => {
                this.kickBall();
            }, 750);
            
            // Reset character and switch to idle after animation duration (estimated 2 seconds)
            setTimeout(() => {
                console.log('Kick animation should be finished, resetting character to original position');
                // Reset character to original position after kick animation
                this.resetCharacter();
                // Switch to idle animation
                this.switchToIdleAnimation();
            }, 2000); // 2 seconds should be enough for most kick animations
            
            // Set clampWhenFinished to true so animation stays in final frame
            this.currentAnimation.clampWhenFinished = true;
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
        // FPS and objects display removed
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
        this.frameCount = (this.frameCount || 0) + 1;
        
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // Update controls
        this.controls.update();
        
        // Handle continuous movement
        this.handleContinuousMovement(deltaTime);
        
        // Update ball physics
        this.updateBallPhysics();
        
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
        
        // Test if reset functions work
        console.log('Testing reset functions...');
        console.log('Game object:', game);
        console.log('Reset functions available:', {
            resetBall: typeof game.resetBall,
            resetCharacter: typeof game.resetCharacter,
            resetGame: typeof game.resetGame
        });
        
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
