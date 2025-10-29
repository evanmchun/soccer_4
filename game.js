// Three.js GLB Game - ES6 Module Version
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class GLBGame {
    constructor() {
        // Ground level constants
        this.GROUND_LEVEL = 0.0;           // True ground level
        this.FIELD_SURFACE = 0.01;         // Turf field surface (slightly above ground)
        this.BALL_GROUND = 0.9;           // Ball ground collision level
        this.FIELD_MARKINGS = 0.02;       // Field markings height
        this.CENTER_DOT = 0.03;           // Center dot height
        this.GRASS_HEIGHT = 0.05;         // Grass blade height
        this.MARKER_HEIGHT = 0.5;         // Click marker height above ground
        
        // Ball collision constants
        this.BALL_RADIUS = 0.9;           // Ball radius (0.9 as requested)
        this.showCollisionSphere = false;  // Show collision sphere for debugging (hidden by default)
        
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
        this.kickSound = null;
        this.audioContextInitialized = false;
        this.ballLanded = false;
        this.ballAttachedToGoalie = false;
        this.ballBouncedOffGoalie = false;
        this.stats = {
            fps: 0,
            objectCount: 0
        };
        
        // Quiz system properties
        this.quizActive = false;
        this.currentQuestionIndex = 0;
        this.quizScore = 0;
        this.quizQuestions = [
            {
                question: "What is the capital of France?",
                answers: ["London", "Paris", "Berlin", "Madrid"],
                correct: 1
            },
            {
                question: "What is 2 + 2?",
                answers: ["3", "4", "5", "6"],
                correct: 1
            },
            {
                question: "What is the largest planet in our solar system?",
                answers: ["Earth", "Saturn", "Jupiter", "Neptune"],
                correct: 2
            },
            {
                question: "Who painted the Mona Lisa?",
                answers: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"],
                correct: 2
            },
            {
                question: "What is the chemical symbol for gold?",
                answers: ["Go", "Gd", "Au", "Ag"],
                correct: 2
            }
        ];
        this.quizAnswered = false;
        this.quizCorrect = false;
        
        // Background music properties
        this.bgMusic = null;
        this.bgMusicLoaded = false;
        this.bgMusicPlaying = false;
        
        // Crowd cheering properties
        this.crowdCheering = null;
        this.crowdCheeringLoaded = false;
        
        // Crowd missed properties (for goalie saves/blocks)
        this.crowdMissed = null;
        this.crowdMissedLoaded = false;
        
        this.init();
    }
    
    setupDracoLoader(loader) {
        // Enable Draco loader for compressed geometry (used in optimized GLB files)
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        loader.setDRACOLoader(dracoLoader);
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
        
        // Stadium will provide the field, no need to create separate field
        this.createTurfField();
        
        // Add short grass on top of the field
        this.createGrass();
        
        // Automatically create sidelines from your corner coordinates
        setTimeout(() => {
            this.createSidelinesFromCorners(-80.20, 0.01, -120.65, 80.20, 0.01, -120.65, -80.20, 0.01, 120.65, 68.56, 0.01, 120.65);
        }, 1000); // Wait 1 second for stadium to load
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
        
        // Restrict camera movement to prevent looking up from below field level
        this.controls.maxPolarAngle = 87 * Math.PI / 180; // Maximum 87 degrees - just below horizontal
        this.controls.minPolarAngle = 0; // Allow looking straight down (minimum 0 degrees - can look down as much as wanted)
        
        // Set the target to the goal post location so zoom focuses on the goal
        this.controls.target.set(0, 0,-90);
    }
    
    createLights() {
        // Further reduced ambient light to make shadows more visible
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // Stronger directional light for more prominent shadows - positioned more overhead for shorter shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(0, 50, 0); // Even higher for very short shadows
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -150; // Extended to cover goalie/goal post area
        
        // Properly set up the target to point towards goalie/goal post area
        directionalLight.target.position.set(0, 0, -100);
        directionalLight.target.updateMatrixWorld();
        
        // Update shadow camera to look at the target area
        directionalLight.shadow.camera.position.copy(directionalLight.position);
        directionalLight.shadow.camera.lookAt(directionalLight.target.position);
        directionalLight.shadow.camera.updateProjectionMatrix();
        
        this.scene.add(directionalLight);
        
        // Reduced hemisphere light to make shadows more visible
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x87CEEB, 0.4);
        this.scene.add(hemisphereLight);
        
        // Fill light from the front (no shadows)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 10, -10);
        fillLight.castShadow = false; // No shadows from fill lights
        this.scene.add(fillLight);
        
        // Removed right-side fill light to prevent bright side lighting
        
        // Removed point lights to prevent bright side lighting on character
    }
    
    // Clean up all test objects and debug helpers
    cleanupShadowTests() {
        console.log('Cleaning up shadow test objects...');
        
        // Remove simple test objects
        this.removeSimpleShadowTestObjects();
        
        // Remove shadow camera helpers
        this.disableShadowDebug();
        
        console.log('✅ All shadow test objects and helpers removed');
    }
    
    // Force directional light to point towards goalie/goal post area
    fixDirectionalLightTarget() {
        const directionalLight = this.scene.children.find(child => 
            child instanceof THREE.DirectionalLight && child.castShadow
        );
        
        if (directionalLight) {
            console.log('Fixing directional light target...');
            
            // Set the light to point towards the goalie/goal post area
            directionalLight.target.position.set(0, 0, -100);
            directionalLight.target.updateMatrixWorld();
            
            // Update shadow camera to look at the target area
            directionalLight.shadow.camera.position.copy(directionalLight.position);
            directionalLight.shadow.camera.lookAt(directionalLight.target.position);
            directionalLight.shadow.camera.updateProjectionMatrix();
            
            console.log('✅ Directional light target set to:', directionalLight.target.position);
            console.log('✅ Shadow camera now looking at goalie/goal post area');
        } else {
            console.log('❌ No directional light found');
        }
    }
    
    // Debug shadow camera and directional light setup
    debugShadowSystem() {
        console.log('=== SHADOW SYSTEM DEBUG ===');
        
        const directionalLight = this.scene.children.find(child => 
            child instanceof THREE.DirectionalLight && child.castShadow
        );
        
        if (directionalLight) {
            console.log('Directional Light:', {
                position: directionalLight.position,
                intensity: directionalLight.intensity,
                castShadow: directionalLight.castShadow,
                target: directionalLight.target ? directionalLight.target.position : 'no target'
            });
            
            console.log('Shadow Camera:', {
                position: directionalLight.shadow.camera.position,
                bounds: {
                    left: directionalLight.shadow.camera.left,
                    right: directionalLight.shadow.camera.right,
                    top: directionalLight.shadow.camera.top,
                    bottom: directionalLight.shadow.camera.bottom,
                    near: directionalLight.shadow.camera.near,
                    far: directionalLight.shadow.camera.far
                },
                mapSize: directionalLight.shadow.mapSize.width + 'x' + directionalLight.shadow.mapSize.height
            });
            
            // Check if goalie/goal post are within shadow camera bounds
            if (this.goalie) {
                const goalieInBounds = this.goalie.position.z >= directionalLight.shadow.camera.bottom && 
                                     this.goalie.position.z <= directionalLight.shadow.camera.top &&
                                     this.goalie.position.x >= directionalLight.shadow.camera.left && 
                                     this.goalie.position.x <= directionalLight.shadow.camera.right;
                console.log('Goalie within shadow camera bounds:', goalieInBounds);
            }
            
            if (this.goalPost) {
                const goalInBounds = this.goalPost.position.z >= directionalLight.shadow.camera.bottom && 
                                    this.goalPost.position.z <= directionalLight.shadow.camera.top &&
                                    this.goalPost.position.x >= directionalLight.shadow.camera.left && 
                                    this.goalPost.position.x <= directionalLight.shadow.camera.right;
                console.log('Goal post within shadow camera bounds:', goalInBounds);
            }
            
        } else {
            console.log('❌ No directional light with shadows found!');
        }
        
        // Check renderer shadow settings
        console.log('Renderer Shadow Settings:', {
            enabled: this.renderer.shadowMap.enabled,
            type: this.renderer.shadowMap.type,
            autoUpdate: this.renderer.shadowMap.autoUpdate
        });
        
        console.log('=== END SHADOW SYSTEM DEBUG ===');
    }
    
    // Update shadow camera bounds to cover goalie and goal post area
    updateShadowCameraBounds() {
        const directionalLight = this.scene.children.find(child => 
            child instanceof THREE.DirectionalLight && child.castShadow
        );
        
        if (directionalLight) {
            console.log('Updating shadow camera bounds...');
            directionalLight.shadow.camera.left = -50;
            directionalLight.shadow.camera.right = 50;
            directionalLight.shadow.camera.top = 50;
            directionalLight.shadow.camera.bottom = -150; // Cover goalie/goal post at Z=-100
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 200;
            
            // Force shadow map update
            directionalLight.shadow.mapSize.width = 4096;
            directionalLight.shadow.mapSize.height = 4096;
            directionalLight.shadow.camera.updateProjectionMatrix();
            
            console.log('✅ Shadow camera bounds updated:', {
                left: directionalLight.shadow.camera.left,
                right: directionalLight.shadow.camera.right,
                top: directionalLight.shadow.camera.top,
                bottom: directionalLight.shadow.camera.bottom,
                near: directionalLight.shadow.camera.near,
                far: directionalLight.shadow.camera.far
            });
        } else {
            console.log('❌ No directional light found');
        }
    }
    
    // Create simple replacement goalie and goal post for shadow testing
    createSimpleShadowTestObjects() {
        console.log('Creating simple shadow test objects...');
        
        // Create simple goalie (cylinder)
        const goalieGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        const goalieMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff }); // Blue
        const simpleGoalie = new THREE.Mesh(goalieGeometry, goalieMaterial);
        simpleGoalie.position.set(0, 1.5, -100); // Same position as real goalie
        simpleGoalie.castShadow = true;
        simpleGoalie.receiveShadow = true;
        simpleGoalie.name = 'simpleGoalie';
        this.scene.add(simpleGoalie);
        
        // Create simple goal post (box)
        const goalGeometry = new THREE.BoxGeometry(2, 4, 0.2);
        const goalMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 }); // Yellow
        const simpleGoal = new THREE.Mesh(goalGeometry, goalMaterial);
        simpleGoal.position.set(0, 2, -100); // Same position as real goal post
        simpleGoal.castShadow = true;
        simpleGoal.receiveShadow = true;
        simpleGoal.name = 'simpleGoal';
        this.scene.add(simpleGoal);
        
        console.log('✅ Simple test objects created:');
        console.log('- Blue cylinder (goalie) at:', simpleGoalie.position);
        console.log('- Yellow box (goal post) at:', simpleGoal.position);
        console.log('These should cast shadows if the shadow system is working');
        
        return { simpleGoalie, simpleGoal };
    }
    
    // Remove simple test objects
    removeSimpleShadowTestObjects() {
        const simpleGoalie = this.scene.children.find(child => child.name === 'simpleGoalie');
        const simpleGoal = this.scene.children.find(child => child.name === 'simpleGoal');
        
        if (simpleGoalie) {
            this.scene.remove(simpleGoalie);
            console.log('✅ Simple goalie removed');
        }
        if (simpleGoal) {
            this.scene.remove(simpleGoal);
            console.log('✅ Simple goal post removed');
        }
    }
    
    // Comprehensive shadow debugging for goalie and goal post
    debugGoalieAndGoalShadows() {
        console.log('=== COMPREHENSIVE SHADOW DEBUG ===');
        
        // Check if objects exist
        console.log('Goalie exists:', !!this.goalie);
        console.log('Goal post exists:', !!this.goalPost);
        
        if (this.goalie) {
            console.log('=== GOALIE ANALYSIS ===');
            console.log('Goalie position:', this.goalie.position);
            console.log('Goalie visible:', this.goalie.visible);
            console.log('Goalie scale:', this.goalie.scale);
            
            let meshCount = 0;
            let shadowCastingCount = 0;
            let basicMaterialCount = 0;
            let lambertMaterialCount = 0;
            
            this.goalie.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;
                    console.log(`Mesh ${meshCount}:`, {
                        name: child.name || 'unnamed',
                        castShadow: child.castShadow,
                        receiveShadow: child.receiveShadow,
                        visible: child.visible,
                        materialType: child.material ? child.material.type : 'no material',
                        position: child.position,
                        scale: child.scale
                    });
                    
                    if (child.castShadow) shadowCastingCount++;
                    if (child.material) {
                        if (child.material.isMeshBasicMaterial) basicMaterialCount++;
                        if (child.material.isMeshLambertMaterial) lambertMaterialCount++;
                    }
                }
            });
            
            console.log('Goalie summary:', {
                totalMeshes: meshCount,
                shadowCastingMeshes: shadowCastingCount,
                basicMaterials: basicMaterialCount,
                lambertMaterials: lambertMaterialCount
            });
        }
        
        if (this.goalPost) {
            console.log('=== GOAL POST ANALYSIS ===');
            console.log('Goal post position:', this.goalPost.position);
            console.log('Goal post visible:', this.goalPost.visible);
            console.log('Goal post scale:', this.goalPost.scale);
            
            let meshCount = 0;
            let shadowCastingCount = 0;
            let basicMaterialCount = 0;
            let lambertMaterialCount = 0;
            
            this.goalPost.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;
                    console.log(`Mesh ${meshCount}:`, {
                        name: child.name || 'unnamed',
                        castShadow: child.castShadow,
                        receiveShadow: child.receiveShadow,
                        visible: child.visible,
                        materialType: child.material ? child.material.type : 'no material',
                        position: child.position,
                        scale: child.scale
                    });
                    
                    if (child.castShadow) shadowCastingCount++;
                    if (child.material) {
                        if (child.material.isMeshBasicMaterial) basicMaterialCount++;
                        if (child.material.isMeshLambertMaterial) lambertMaterialCount++;
                    }
                }
            });
            
            console.log('Goal post summary:', {
                totalMeshes: meshCount,
                shadowCastingMeshes: shadowCastingCount,
                basicMaterials: basicMaterialCount,
                lambertMaterials: lambertMaterialCount
            });
        }
        
        // Check directional light
        const directionalLight = this.scene.children.find(child => 
            child instanceof THREE.DirectionalLight && child.castShadow
        );
        
        if (directionalLight) {
            console.log('=== DIRECTIONAL LIGHT ===');
            console.log('Position:', directionalLight.position);
            console.log('Intensity:', directionalLight.intensity);
            console.log('Cast shadow:', directionalLight.castShadow);
            console.log('Shadow map size:', directionalLight.shadow.mapSize.width + 'x' + directionalLight.shadow.mapSize.height);
            console.log('Shadow camera bounds:', {
                left: directionalLight.shadow.camera.left,
                right: directionalLight.shadow.camera.right,
                top: directionalLight.shadow.camera.top,
                bottom: directionalLight.shadow.camera.bottom,
                near: directionalLight.shadow.camera.near,
                far: directionalLight.shadow.camera.far
            });
        }
        
        console.log('=== END DEBUG ===');
    }
    
    // Force fix shadows on goalie and goal post (for already loaded objects)
    fixGoalieAndGoalShadows() {
        console.log('=== FIXING GOALIE AND GOAL SHADOWS ===');
        
        // Fix goalie shadows
        if (this.goalie) {
            console.log('Fixing goalie shadows...');
            this.goalie.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Fix material for shadows
                    if (child.material) {
                        if (child.material.isMeshBasicMaterial) {
                            const newMaterial = new THREE.MeshLambertMaterial({
                                color: child.material.color,
                                map: child.material.map,
                                transparent: child.material.transparent,
                                opacity: child.material.opacity
                            });
                            child.material = newMaterial;
                        }
                        child.material.needsUpdate = true;
                    }
                    console.log('Fixed goalie mesh:', child.name || 'unnamed');
                }
            });
        } else {
            console.log('❌ Goalie not found');
        }
        
        // Fix goal post shadows
        if (this.goalPost) {
            console.log('Fixing goal post shadows...');
            this.goalPost.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Fix material for shadows
                    if (child.material) {
                        if (child.material.isMeshBasicMaterial) {
                            const newMaterial = new THREE.MeshLambertMaterial({
                                color: child.material.color,
                                map: child.material.map,
                                transparent: child.material.transparent,
                                opacity: child.material.opacity
                            });
                            child.material = newMaterial;
                        }
                        child.material.needsUpdate = true;
                    }
                    console.log('Fixed goal post mesh:', child.name || 'unnamed');
                }
            });
        } else {
            console.log('❌ Goal post not found');
        }
        
        console.log('✅ Shadow fixes applied to goalie and goal post');
    }
    
    // Create a simple test cube to verify shadows are working
    createShadowTestCube() {
        console.log('Creating shadow test cube...');
        
        // Create a simple cube that should cast a shadow
        const geometry = new THREE.BoxGeometry(2, 4, 2);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Red cube
        const testCube = new THREE.Mesh(geometry, material);
        
        // Position it near the goalie area
        testCube.position.set(10, 2, -50); // To the right of the field
        testCube.castShadow = true;
        testCube.receiveShadow = true;
        
        this.scene.add(testCube);
        
        console.log('✅ Shadow test cube added at position:', testCube.position);
        console.log('You should see a red cube casting a shadow on the field');
        
        return testCube;
    }
    
    // Remove the shadow test cube
    removeShadowTestCube() {
        const testCube = this.scene.children.find(child => 
            child.isMesh && child.material && child.material.color && 
            child.material.color.getHex() === 0xff0000
        );
        
        if (testCube) {
            this.scene.remove(testCube);
            console.log('✅ Shadow test cube removed');
        } else {
            console.log('❌ No shadow test cube found');
        }
    }
    
    // Force enable shadows on all objects and check their positions
    forceEnableShadows() {
        console.log('=== FORCE ENABLING SHADOWS ===');
        
        // Check and force enable shadows on goalie
        if (this.goalie) {
            console.log('Goalie position:', this.goalie.position);
            console.log('Goalie visible:', this.goalie.visible);
            this.goalie.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    console.log('Forced shadows on goalie mesh:', child.name || 'unnamed');
                }
            });
        } else {
            console.log('❌ Goalie not found!');
        }
        
        // Check and force enable shadows on goal post
        if (this.goalPost) {
            console.log('Goal post position:', this.goalPost.position);
            console.log('Goal post visible:', this.goalPost.visible);
            this.goalPost.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    console.log('Forced shadows on goal post mesh:', child.name || 'unnamed');
                }
            });
        } else {
            console.log('❌ Goal post not found!');
        }
        
        // Check and force enable shadows on ball
        if (this.ball) {
            console.log('Ball position:', this.ball.position);
            console.log('Ball visible:', this.ball.visible);
            this.ball.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    console.log('Forced shadows on ball mesh:', child.name || 'unnamed');
                }
            });
        } else {
            console.log('❌ Ball not found!');
        }
        
        // Check and force enable shadows on player
        if (this.model) {
            console.log('Player position:', this.model.position);
            console.log('Player visible:', this.model.visible);
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    console.log('Forced shadows on player mesh:', child.name || 'unnamed');
                }
            });
        } else {
            console.log('❌ Player not found!');
        }
        
        // Force enable shadows on field
        this.scene.traverse((child) => {
            if (child.isMesh && child.material && child.material.color && 
                child.material.color.getHex() === 0x228B22) { // Turf field color
                child.receiveShadow = true;
                console.log('Forced shadows on field mesh:', child.name || 'unnamed');
            }
        });
        
        console.log('✅ Shadows force-enabled on all objects');
    }
    
    // Helper method to check shadow configuration of objects
    checkShadowConfiguration() {
        console.log('=== SHADOW CONFIGURATION CHECK ===');
        
        // Check directional light
        const directionalLight = this.scene.children.find(child => 
            child instanceof THREE.DirectionalLight && child.castShadow
        );
        
        if (directionalLight) {
            console.log('✅ Directional light found:', {
                intensity: directionalLight.intensity,
                castShadow: directionalLight.castShadow,
                shadowMapSize: directionalLight.shadow.mapSize.width + 'x' + directionalLight.shadow.mapSize.height
            });
        } else {
            console.log('❌ No directional light with shadows found!');
        }
        
        // Check goalie
        if (this.goalie) {
            let goalieShadowCount = 0;
            this.goalie.traverse((child) => {
                if (child.isMesh) {
                    if (child.castShadow) goalieShadowCount++;
                }
            });
            console.log('✅ Goalie shadow meshes:', goalieShadowCount);
        } else {
            console.log('❌ Goalie not loaded');
        }
        
        // Check goal post
        if (this.goalPost) {
            let goalShadowCount = 0;
            this.goalPost.traverse((child) => {
                if (child.isMesh) {
                    if (child.castShadow) goalShadowCount++;
                }
            });
            console.log('✅ Goal post shadow meshes:', goalShadowCount);
        } else {
            console.log('❌ Goal post not loaded');
        }
        
        // Check ball
        if (this.ball) {
            let ballShadowCount = 0;
            this.ball.traverse((child) => {
                if (child.isMesh) {
                    if (child.castShadow) ballShadowCount++;
                }
            });
            console.log('✅ Ball shadow meshes:', ballShadowCount);
        } else {
            console.log('❌ Ball not loaded');
        }
        
        // Check field
        const fieldMeshes = this.scene.children.filter(child => 
            child.isMesh && child.receiveShadow
        );
        console.log('✅ Field meshes receiving shadows:', fieldMeshes.length);
    }
    
    // Helper method to enable shadow camera visualization for debugging
    enableShadowDebug() {
        const directionalLight = this.scene.children.find(child => 
            child instanceof THREE.DirectionalLight && child.castShadow
        );
        
        if (directionalLight) {
            const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
            this.scene.add(shadowHelper);
            console.log('Shadow camera helper added. You should see a yellow wireframe box showing shadow camera bounds.');
            return true;
        } else {
            console.log('No directional light with shadows found!');
            return false;
        }
    }
    
    // Helper method to disable shadow camera visualization
    disableShadowDebug() {
        const helpers = this.scene.children.filter(child => child instanceof THREE.CameraHelper);
        helpers.forEach(helper => this.scene.remove(helper));
        console.log('Shadow camera helpers removed.');
    }
    
    createTurfField() {
        console.log('Creating turf field...');
        
        // Create a large turf field
        const fieldGeometry = new THREE.PlaneGeometry(200, 300); // Large field
        const fieldMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22 // Darker green turf color
        });
        
        const turfField = new THREE.Mesh(fieldGeometry, fieldMaterial);
        turfField.rotation.x = -Math.PI / 2; // Lay flat on ground
        turfField.position.y = this.FIELD_SURFACE; // Use constant for field surface
        turfField.receiveShadow = true;
        
        this.scene.add(turfField);
        
        // Add field markings
        this.createFieldMarkings();
        
        console.log('Turf field created!');
    }
    
    createFieldMarkings() {
        console.log('=== DEBUG: Creating field markings ===');
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        
        // Very thick sideline perimeter using box geometry for maximum visibility
        const sidelineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff
        });
        
        console.log('Sideline material created:', sidelineMaterial);
        
        // Top sideline - using box geometry (scaled to match stadium)
        const topSidelineGeometry = new THREE.BoxGeometry(2000, 5, 100); // 10x bigger
        const topSideline = new THREE.Mesh(topSidelineGeometry, sidelineMaterial);
        topSideline.position.set(0, 2.5, -1500); // 10x bigger positions
        topSideline.name = 'topSideline';
        this.scene.add(topSideline);
        console.log('Top sideline added at position:', topSideline.position);
        
        // Bottom sideline - using box geometry (scaled to match stadium)
        const bottomSidelineGeometry = new THREE.BoxGeometry(2000, 5, 100); // 10x bigger
        const bottomSideline = new THREE.Mesh(bottomSidelineGeometry, sidelineMaterial);
        bottomSideline.position.set(0, 2.5, 1500); // 10x bigger positions
        bottomSideline.name = 'bottomSideline';
        this.scene.add(bottomSideline);
        console.log('Bottom sideline added at position:', bottomSideline.position);
        
        // Left sideline - using box geometry (scaled to match stadium)
        const leftSidelineGeometry = new THREE.BoxGeometry(100, 5, 3000); // 10x bigger
        const leftSideline = new THREE.Mesh(leftSidelineGeometry, sidelineMaterial);
        leftSideline.position.set(-1000, 2.5, 0); // 10x bigger positions
        leftSideline.name = 'leftSideline';
        this.scene.add(leftSideline);
        console.log('Left sideline added at position:', leftSideline.position);
        
        // Right sideline - using box geometry (scaled to match stadium)
        const rightSidelineGeometry = new THREE.BoxGeometry(100, 5, 3000); // 10x bigger
        const rightSideline = new THREE.Mesh(rightSidelineGeometry, sidelineMaterial);
        rightSideline.position.set(1000, 2.5, 0); // 10x bigger positions
        rightSideline.name = 'rightSideline';
        this.scene.add(rightSideline);
        console.log('Right sideline added at position:', rightSideline.position);
        
        console.log('=== DEBUG: All sidelines added to scene ===');
        console.log('Scene children count:', this.scene.children.length);
        
        // Debug: List all scene children
        this.scene.children.forEach((child, index) => {
            if (child.name && child.name.includes('sideline')) {
                console.log(`Scene child ${index}: ${child.name} at position:`, child.position);
            }
        });
        
        // Center line
        const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-100, 0.02, 0),
            new THREE.Vector3(100, 0.02, 0)
        ]);
        const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
        this.scene.add(centerLine);
        
        // Center circle
        const circleGeometry = new THREE.RingGeometry(18, 18.5, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            side: THREE.DoubleSide 
        });
        const centerCircle = new THREE.Mesh(circleGeometry, circleMaterial);
        centerCircle.rotation.x = -Math.PI / 2;
        centerCircle.position.y = 0.02;
        this.scene.add(centerCircle);
        
        // Center dot
        const dotGeometry = new THREE.CircleGeometry(0.5, 16);
        const dot = new THREE.Mesh(dotGeometry, circleMaterial);
        dot.rotation.x = -Math.PI / 2;
        dot.position.y = 0.03;
        this.scene.add(dot);
        
        // Goal areas
        const goalAreaGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-20, 0.02, -150),
            new THREE.Vector3(20, 0.02, -150),
            new THREE.Vector3(20, 0.02, -120),
            new THREE.Vector3(-20, 0.02, -120),
            new THREE.Vector3(-20, 0.02, -150)
        ]);
        const goalArea1 = new THREE.Line(goalAreaGeometry, lineMaterial);
        this.scene.add(goalArea1);
        
        const goalArea2Geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-20, 0.02, 150),
            new THREE.Vector3(20, 0.02, 150),
            new THREE.Vector3(20, 0.02, 120),
            new THREE.Vector3(-20, 0.02, 120),
            new THREE.Vector3(-20, 0.02, 150)
        ]);
        const goalArea2 = new THREE.Line(goalArea2Geometry, lineMaterial);
        this.scene.add(goalArea2);
        
        console.log('Field markings with sideline added!');
    }
    
    createGrass() {
        console.log('Creating shader-based swaying grass for soccer field...');
        
        // Shader material for realistic grass animation
        const vertexShader = `
            varying vec2 vUv;
            uniform float time;
            
            void main() {
                vUv = uv;
                
                // VERTEX POSITION
                vec4 mvPosition = vec4( position, 1.0 );
                #ifdef USE_INSTANCING
                    mvPosition = instanceMatrix * mvPosition;
                #endif
                
                // DISPLACEMENT - Wind effect
                // Stronger displacement on blade tips
                float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
                
                // Wind displacement based on position and time
                float displacement = sin( mvPosition.z + time * 3.0 ) * ( 0.05 * dispPower );
                mvPosition.z += displacement;
                
                vec4 modelViewPosition = modelViewMatrix * mvPosition;
                gl_Position = projectionMatrix * modelViewPosition;
            }
        `;

        const fragmentShader = `
            varying vec2 vUv;
            
            void main() {
                vec3 baseColor = vec3( 0.2, 0.8, 0.2 ); // Soccer field green
                float clarity = ( vUv.y * 0.3 ) + 0.7; // Gradient from dark to light
                gl_FragColor = vec4( baseColor * clarity, 0.9 );
            }
        `;

        // Create uniforms for shader
        this.grassUniforms = {
            time: { value: 0 }
        };

        // Create shader material
        const grassMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.grassUniforms,
            side: THREE.DoubleSide,
            transparent: true
        });

        // Create grass blade geometry (short for soccer field)
        const grassBladeGeometry = new THREE.PlaneGeometry(0.05, 0.2, 1, 4);
        grassBladeGeometry.translate(0, 0.1, 0); // Move lowest point to 0

        // Create instanced mesh
        const grassCount = 50000; // Massive amount of grass blades
        const grassMesh = new THREE.InstancedMesh(grassBladeGeometry, grassMaterial, grassCount);
        
        // Store grass mesh for animation
        this.grassMesh = grassMesh;
        this.grassCount = grassCount;

        // Position grass blades across the field
        const dummy = new THREE.Object3D();
        const fieldWidth = 160; // Match your field width
        const fieldLength = 240; // Match your field length

        for (let i = 0; i < grassCount; i++) {
            // Random position within field bounds
            dummy.position.set(
                (Math.random() - 0.5) * fieldWidth,
                0.05, // Slightly above field
                (Math.random() - 0.5) * fieldLength
            );
            
            // Random scale for variation
            dummy.scale.setScalar(0.5 + Math.random() * 0.5);
            
            // Random rotation
            dummy.rotation.y = Math.random() * Math.PI;
            
            dummy.updateMatrix();
            grassMesh.setMatrixAt(i, dummy.matrix);
        }

        // Add to scene
        this.scene.add(grassMesh);
        
        console.log('Shader-based swaying soccer field grass created with', grassCount, 'blades');
    }
    
    // Animate grass swaying using shader uniforms
    animateGrass() {
        if (!this.grassUniforms) return;
        
        // Update time uniform for shader animation
        this.grassUniforms.time.value = this.clock.getElapsedTime();
    }
    
    // Debug function to check sidelines - call from browser console
    debugSidelines() {
        console.log('=== DEBUG SIDELINES ===');
        console.log('Scene children count:', this.scene.children.length);
        
        // Debug: List ALL scene children to see what's there
        console.log('=== ALL SCENE CHILDREN ===');
        this.scene.children.forEach((child, index) => {
            console.log(`Child ${index}: ${child.name || 'unnamed'} (${child.type})`);
        });
        
        const sidelines = [];
        this.scene.children.forEach((child, index) => {
            if (child.name && child.name.toLowerCase().includes('sideline')) {
                sidelines.push(child);
                console.log(`Found sideline: ${child.name}`);
                console.log(`  Position:`, child.position);
                console.log(`  Visible:`, child.visible);
                console.log(`  Material:`, child.material);
                console.log(`  Geometry:`, child.geometry);
            }
        });
        
        console.log(`Total sidelines found: ${sidelines.length}`);
        
        if (sidelines.length === 0) {
            console.log('❌ NO SIDELINES FOUND! Something went wrong.');
            console.log('The sidelines were added but are no longer in the scene.');
        } else {
            console.log('✅ Sidelines found, checking if they are visible...');
            sidelines.forEach(sideline => {
                console.log(`${sideline.name}: visible=${sideline.visible}, position=${sideline.position.x},${sideline.position.y},${sideline.position.z}`);
            });
            
            // Debug camera position
            console.log('=== CAMERA DEBUG ===');
            console.log('Camera position:', this.camera.position);
            console.log('Camera rotation:', this.camera.rotation);
            
            // Debug stadium scale
            if (this.stadium) {
                console.log('=== STADIUM DEBUG ===');
                console.log('Stadium scale:', this.stadium.scale);
                console.log('Stadium position:', this.stadium.position);
            }
            
            // Try to make sidelines more visible by making them bigger and brighter
            console.log('=== MAKING SIDELINES MORE VISIBLE ===');
            sidelines.forEach(sideline => {
                // Make them bigger
                sideline.scale.set(2, 2, 2);
                // Make them brighter
                sideline.material.color.setHex(0xff0000); // Bright red for testing
                console.log(`Made ${sideline.name} bigger and red for testing`);
            });
        }
        
        return sidelines;
    }
    
    // Manual sideline positioning function - call from browser console
    positionSidelines(topX, topY, topZ, bottomX, bottomY, bottomZ, leftX, leftY, leftZ, rightX, rightY, rightZ) {
        console.log('=== MANUAL SIDELINE POSITIONING ===');
        
        // Find existing sidelines
        const sidelines = [];
        this.scene.children.forEach((child) => {
            if (child.name && child.name.toLowerCase().includes('sideline')) {
                sidelines.push(child);
            }
        });
        
        if (sidelines.length !== 4) {
            console.log('❌ Expected 4 sidelines, found:', sidelines.length);
            return;
        }
        
        // Position sidelines based on provided coordinates
        const topSideline = sidelines.find(s => s.name === 'topSideline');
        const bottomSideline = sidelines.find(s => s.name === 'bottomSideline');
        const leftSideline = sidelines.find(s => s.name === 'leftSideline');
        const rightSideline = sidelines.find(s => s.name === 'rightSideline');
        
        if (topSideline) {
            topSideline.position.set(topX, topY, topZ);
            console.log(`✅ Top sideline positioned at: (${topX}, ${topY}, ${topZ})`);
        }
        
        if (bottomSideline) {
            bottomSideline.position.set(bottomX, bottomY, bottomZ);
            console.log(`✅ Bottom sideline positioned at: (${bottomX}, ${bottomY}, ${bottomZ})`);
        }
        
        if (leftSideline) {
            leftSideline.position.set(leftX, leftY, leftZ);
            console.log(`✅ Left sideline positioned at: (${leftX}, ${leftY}, ${leftZ})`);
        }
        
        if (rightSideline) {
            rightSideline.position.set(rightX, rightY, rightZ);
            console.log(`✅ Right sideline positioned at: (${rightX}, ${rightY}, ${rightZ})`);
        }
        
        // Make them bright red and bigger for testing
        sidelines.forEach(sideline => {
            sideline.material.color.setHex(0xff0000); // Bright red
            sideline.scale.set(3, 3, 3); // 3x bigger
        });
        
        console.log('🎯 All sidelines made bright red and 3x bigger for visibility!');
        console.log('💡 Usage: game.positionSidelines(topX, topY, topZ, bottomX, bottomY, bottomZ, leftX, leftY, leftZ, rightX, rightY, rightZ)');
    }
    
    // Make sidelines white again
    makeSidelinesWhite() {
        console.log('=== MAKING SIDELINES WHITE ===');
        
        const sidelines = [];
        this.scene.children.forEach((child) => {
            if (child.name && child.name.toLowerCase().includes('sideline')) {
                sidelines.push(child);
            }
        });
        
        sidelines.forEach(sideline => {
            sideline.material.color.setHex(0xffffff); // White
            sideline.scale.set(1, 1, 1); // Normal size
            console.log(`Made ${sideline.name} white and normal size`);
        });
        
        console.log('✅ All sidelines are now white and normal size!');
    }
    
    // Create sidelines from four corner points
    createSidelinesFromCorners(topLeftX, topLeftY, topLeftZ, topRightX, topRightY, topRightZ, bottomLeftX, bottomLeftY, bottomLeftZ, bottomRightX, bottomRightY, bottomRightZ) {
        console.log('=== CREATING SIDELINES FROM FOUR CORNERS ===');
        
        // Remove existing sidelines and rectangle first
        const existingSidelines = [];
        this.scene.children.forEach((child) => {
            if (child.name && (child.name.toLowerCase().includes('sideline') || child.name === 'fieldRectangle')) {
                existingSidelines.push(child);
            }
        });
        
        existingSidelines.forEach(sideline => {
            this.scene.remove(sideline);
        });
        
        console.log(`Removed ${existingSidelines.length} existing sidelines/rectangle`);
        
        // Calculate dimensions - use average width for perfect rectangle
        const topWidth = Math.abs(topRightX - topLeftX);
        const bottomWidth = Math.abs(bottomRightX - bottomLeftX);
        const fieldWidth = (topWidth + bottomWidth) / 2; // Average width for perfect rectangle
        const fieldLength = Math.abs(bottomLeftZ - topLeftZ);
        const centerX = (topLeftX + topRightX) / 2;
        const centerZ = (topLeftZ + bottomLeftZ) / 2;
        const height = topLeftY;
        
        console.log(`Field dimensions: ${fieldWidth} x ${fieldLength}`);
        console.log(`Center: (${centerX}, ${height}, ${centerZ})`);
        
        // Calculate perfect rectangle corners
        const rectTopLeftX = centerX - fieldWidth / 2;
        const rectTopRightX = centerX + fieldWidth / 2;
        const rectBottomLeftX = centerX - fieldWidth / 2;
        const rectBottomRightX = centerX + fieldWidth / 2;
        
        // Create a single thin rectangular outline using lines
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff, 
            linewidth: 1
        });
        
        // Create rectangle outline geometry
        const rectanglePoints = [
            new THREE.Vector3(rectTopLeftX, height, topLeftZ),     // Top left
            new THREE.Vector3(rectTopRightX, height, topLeftZ),   // Top right
            new THREE.Vector3(rectBottomRightX, height, bottomLeftZ), // Bottom right
            new THREE.Vector3(rectBottomLeftX, height, bottomLeftZ),   // Bottom left
            new THREE.Vector3(rectTopLeftX, height, topLeftZ)      // Back to top left to close
        ];
        
        const rectangleGeometry = new THREE.BufferGeometry().setFromPoints(rectanglePoints);
        const rectangleOutline = new THREE.Line(rectangleGeometry, lineMaterial);
        rectangleOutline.name = 'fieldRectangle';
        this.scene.add(rectangleOutline);
        
        console.log(`✅ Single thin rectangle outline created`);
        console.log(`Rectangle corners:`);
        console.log(`  Top Left: (${rectTopLeftX}, ${height}, ${topLeftZ})`);
        console.log(`  Top Right: (${rectTopRightX}, ${height}, ${topLeftZ})`);
        console.log(`  Bottom Right: (${rectBottomRightX}, ${height}, ${bottomLeftZ})`);
        console.log(`  Bottom Left: (${rectBottomLeftX}, ${height}, ${bottomLeftZ})`);
        
        console.log('🎯 Sidelines created from your four corner points!');
        console.log('💡 Usage: game.createSidelinesFromCorners(topLeftX, topLeftY, topLeftZ, topRightX, topRightY, topRightZ, bottomLeftX, bottomLeftY, bottomLeftZ, bottomRightX, bottomRightY, bottomRightZ)');
    }
    
    // Enable click-to-get-coordinates mode
    enableClickCoordinates() {
        console.log('🎯 Click-to-get-coordinates mode enabled!');
        console.log('Click anywhere on the field to see the exact 3D coordinates');
        
        // Remove existing click listener if any
        if (this.clickCoordinatesEnabled) {
            this.renderer.domElement.removeEventListener('click', this.clickCoordinatesHandler);
        }
        
        this.clickCoordinatesEnabled = true;
        
        // Create raycaster for mouse picking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Click handler
        this.clickCoordinatesHandler = (event) => {
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Update the picking ray with the camera and mouse position
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Find all objects that intersect with the ray
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                console.log('🎯 CLICKED COORDINATES:');
                console.log(`X: ${point.x.toFixed(2)}`);
                console.log(`Y: ${point.y.toFixed(2)}`);
                console.log(`Z: ${point.z.toFixed(2)}`);
                console.log(`Full coordinates: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
                
                // Create a temporary marker at the clicked point
                this.createClickMarker(point);
                
                // Copy coordinates to clipboard (if supported)
                const coords = `(${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(coords).then(() => {
                        console.log('📋 Coordinates copied to clipboard!');
                    }).catch(() => {
                        console.log('📋 Could not copy to clipboard, but coordinates are logged above');
                    });
                }
            } else {
                console.log('❌ No object found at click position');
            }
        };
        
        // Add click listener
        this.renderer.domElement.addEventListener('click', this.clickCoordinatesHandler);
        
        console.log('✅ Click listener added! Click anywhere on the field now.');
    }
    
    // Disable click-to-get-coordinates mode
    disableClickCoordinates() {
        if (this.clickCoordinatesEnabled && this.clickCoordinatesHandler) {
            this.renderer.domElement.removeEventListener('click', this.clickCoordinatesHandler);
            this.clickCoordinatesEnabled = false;
            console.log('❌ Click-to-get-coordinates mode disabled');
        }
    }
    
    // Create a temporary marker at clicked point
    createClickMarker(point) {
        // Remove existing markers
        const existingMarkers = [];
        this.scene.children.forEach((child) => {
            if (child.name && child.name.includes('clickMarker')) {
                existingMarkers.push(child);
            }
        });
        
        existingMarkers.forEach(marker => {
            this.scene.remove(marker);
        });
        
        // Create new marker
        const markerGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Bright red
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(point);
        marker.position.y += 0.5; // Raise slightly above ground
        marker.name = 'clickMarker';
        
        this.scene.add(marker);
        
        // Remove marker after 3 seconds
        setTimeout(() => {
            this.scene.remove(marker);
        }, 3000);
        
        console.log('🔴 Red marker placed at clicked location (will disappear in 3 seconds)');
    }
    
    loadGLBModel(modelPath) {
        const loader = new GLTFLoader();
        this.setupDracoLoader(loader);
        
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
        this.setupDracoLoader(loader);
        const timestamp = Date.now();
        
        loader.load(
            `character/goal.glb?v=${timestamp}`,
            (gltf) => {
                console.log('Goal post loaded successfully');
                
                // Position the goal post in the scene
                const goalPost = gltf.scene;
                goalPost.position.set(0, 0, -100); // Moved forward (closer to character)
                goalPost.rotation.y = Math.PI; // Rotate 180 degrees to face the character
                goalPost.scale.set(5, 5, 5); // Made a little bigger
                
                // Enable shadows for the goal post
                goalPost.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Ensure no collision detection
                        child.userData = { noCollision: true };
                        
                        // Ensure material is shadow-compatible
                        if (child.material) {
                            if (child.material.isMeshBasicMaterial) {
                                // Convert BasicMaterial to LambertMaterial for shadows
                                const newMaterial = new THREE.MeshLambertMaterial({
                                    color: child.material.color,
                                    map: child.material.map,
                                    transparent: child.material.transparent,
                                    opacity: child.material.opacity
                                });
                                child.material = newMaterial;
                            }
                            child.material.needsUpdate = true;
                        }
                    }
                });
                
                // Make the goalpost visible
                goalPost.visible = true;
                
                // Add to scene
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
        const goalCenterZ = -115; // Moved further back (away from character)
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
        
        // Hide the collision box (make it invisible)
        collisionBox.visible = false;
        
        // Add to scene
        this.scene.add(collisionBox);
        
        // Store reference for potential removal later
        this.goalCollisionVisualizer = collisionBox;
        
        console.log('Goal collision visualizer added - Hidden red wireframe box');
        console.log('Collision bounds - X: ±16.5, Y: 0-11, Z: -104 to -96');
    }
    
    kickBall() {
        if (!this.ball) return;
        
        console.log('Kicking ball!');
        
        // Initialize audio context on first user interaction
        if (!this.audioContextInitialized) {
            console.log('Initializing audio context on first user interaction');
            this.audioContextInitialized = true;
            // Try to resume audio context if it's suspended
            if (this.kickSound && this.kickSound.context) {
                this.kickSound.context.resume();
            }
        }
        
        // Play kick sound if available (try both Three.js and HTML5)
        let soundPlayed = false;
        
        if (this.kickSound) {
            console.log('Playing Three.js kick sound');
            try {
                this.kickSound.play();
                console.log('Three.js kick sound play() called successfully');
                soundPlayed = true;
            } catch (error) {
                console.error('Error playing Three.js kick sound:', error);
            }
        }
        
        if (this.html5KickSound && !soundPlayed) {
            console.log('Playing HTML5 kick sound');
            try {
                this.html5KickSound.currentTime = 0; // Reset to beginning
                this.html5KickSound.play();
                console.log('HTML5 kick sound play() called successfully');
                soundPlayed = true;
            } catch (error) {
                console.error('Error playing HTML5 kick sound:', error);
            }
        }
        
        if (!soundPlayed) {
            console.log('No kick sound available - neither Three.js nor HTML5 audio loaded');
        }
        
        // Use the pre-calculated direction from playKickAnimation()
        const direction = this.ballDirection || new THREE.Vector3(0, 0, -1); // Fallback if not set
        console.log('Using stored direction:', direction.x.toFixed(2), direction.y.toFixed(2), direction.z.toFixed(2));
        
        // Set velocity with reduced power for slower ball speed
        const kickPower = 2.7; // Reduced ball speed
        this.ballVelocity.set(
            direction.x * kickPower,
            direction.y * kickPower + 0.1, // Lower trajectory
            direction.z * kickPower
        );
        
        this.ballKicked = true;
        this.ballLanded = false; // Reset landing flag when ball is kicked
        
        console.log('Velocity:', this.ballVelocity.x.toFixed(2), this.ballVelocity.y.toFixed(2), this.ballVelocity.z.toFixed(2));
    }
    
    updateBallPhysics() {
        if (!this.ball || (!this.ballKicked && !this.goalScored)) {
            this.ballStopTimer = 0;
            return;
        }
        
        // Check for goalie collision/save
        if (this.ballKicked && !this.goalScored && this.checkGoalieCollision()) {
            this.handleGoalieSave();
            return; // Stop physics update if ball is saved
        }
        
        // Minimal debug logging - only when ball is kicked and every 60 frames, but stop once landed
        if (this.ballKicked && !this.goalScored && !this.ballLanded && this.frameCount % 60 === 0) {
            console.log('Ball:', this.ball.position.x.toFixed(1), this.ball.position.y.toFixed(1), this.ball.position.z.toFixed(1));
        }
        
        // Handle goal celebration
        if (this.goalScored) {
            // Only apply gravity if ball hasn't landed yet
            if (!this.ballLanded) {
            // Apply gravity to make ball fall
            this.ballVelocity.y += this.ballGravity;
            
            // Update ball position
            this.ball.position.add(this.ballVelocity);
            
        // Check if ball hit the ground (sphere-based collision)
                // Use bounding box center to get actual ball center position
                const box = new THREE.Box3().setFromObject(this.ball);
                const ballCenterY = box.getCenter(new THREE.Vector3()).y;
                
                if (ballCenterY - this.BALL_RADIUS <= this.GROUND_LEVEL) {
                    // Adjust ball position so the actual center is at the right height
                    const offsetY = ballCenterY - this.ball.position.y; // Offset between model position and actual center
                    this.ball.position.y = this.GROUND_LEVEL + this.BALL_RADIUS - offsetY; // Position ball so its bottom touches ground
            this.ballVelocity.y = 0; // Stop falling
            this.ballLanded = true;
                }
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
        
        // Update collision sphere position
        this.updateBallCollisionSphere();
        
        // CRITICAL: Apply boundary constraints BEFORE checking goal area
        // This prevents the ball from exiting the goal area before constraints are applied
        // DISABLED: This was causing ball teleporting by snapping positions
        // this.applyGoalAreaBoundaryConstraints();
        
        // Check if ball is in the goal area and apply slowing effect
        const inGoalArea = this.checkGoalArea();
        if (inGoalArea && !this.goalScored) {
            console.log('*** GOAL AREA ***');
            this.handleGoalArea();
        }
        
        // CRITICAL SAFETY CHECK: If ball was ever in goal area, ensure it cannot escape
        // DISABLED: This was causing ball teleporting by snapping positions
        // if (this.goalScored) {
        //     this.ensureBallCannotEscape();
        // }
        
        // Check if ball hit the ground (sphere-based collision)
        // Use bounding box center to get actual ball center position
        const box = new THREE.Box3().setFromObject(this.ball);
        const ballCenterY = box.getCenter(new THREE.Vector3()).y;
        
        if (ballCenterY - this.BALL_RADIUS <= this.GROUND_LEVEL) {
            // Adjust ball position so the actual center is at the right height
            const offsetY = ballCenterY - this.ball.position.y; // Offset between model position and actual center
            this.ball.position.y = this.GROUND_LEVEL + this.BALL_RADIUS - offsetY; // Position ball so its bottom touches ground
            this.ballVelocity.y *= -0.6; // Bounce with reduced energy
            this.ballVelocity.x *= 0.8;  // Reduce horizontal speed on bounce
            this.ballVelocity.z *= 0.8;
            
            // Set ballLanded flag to stop position logging
            this.ballLanded = true;
            
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
            console.log('*** RESET - Ball too far ***');
            this.resetBall();
        }
    }
    
    applyGoalAreaBoundaryConstraints() {
        if (!this.ball) return;
        
        // Goal area dimensions (same as the red collision box)
        const goalCenterZ = -115; // Updated to match red collision box position
        const goalWidth = 33; // Width of the red box
        const goalHeight = 11; // Height of the red box
        const goalDepth = 8; // Depth of the red box (z = -113 to -105)
        
        // Constrain ball position to stay within the red box boundaries
        const minX = -goalWidth / 2;  // -16.5
        const maxX = goalWidth / 2;   // 16.5
        const minY = this.GROUND_LEVEL; // Use true ground level
        const maxY = goalHeight;      // 11
        const minZ = goalCenterZ - goalDepth / 2;  // -113
        const maxZ = goalCenterZ + goalDepth / 2;  // -105
        
        // Only apply constraints if ball is near the goal area (to avoid affecting ball elsewhere)
        if (this.ball.position.z < -80) {
            // Only log boundary constraints if ball hasn't landed yet
            if (!this.ballLanded) {
                console.log('APPLYING BOUNDARY CONSTRAINTS - Ball position:', this.ball.position);
                console.log('APPLYING BOUNDARY CONSTRAINTS - Boundaries: X:', minX, 'to', maxX, 'Y:', minY, 'to', maxY, 'Z:', minZ, 'to', maxZ);
            }
            
            // CRITICAL: Keep ball sphere within X boundaries - ball CANNOT escape
            if (this.ball.position.x - this.BALL_RADIUS < minX) {
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit left boundary at x =', this.ball.position.x, 'constraining to', minX + this.BALL_RADIUS);
                }
                this.ball.position.x = minX + this.BALL_RADIUS; // Position ball so its left edge touches boundary
                this.ballVelocity.x = 0; // Stop horizontal movement completely
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to left boundary - CANNOT ESCAPE');
                }
            } else if (this.ball.position.x + this.BALL_RADIUS > maxX) {
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit right boundary at x =', this.ball.position.x, 'constraining to', maxX - this.BALL_RADIUS);
                }
                this.ball.position.x = maxX - this.BALL_RADIUS; // Position ball so its right edge touches boundary
                this.ballVelocity.x = 0; // Stop horizontal movement completely
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to right boundary - CANNOT ESCAPE');
                }
            }
            
            // CRITICAL: Keep ball sphere within Y boundaries - ball CANNOT escape
            if (this.ball.position.y - this.BALL_RADIUS < minY) {
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit bottom boundary at y =', this.ball.position.y, 'constraining to', minY + this.BALL_RADIUS);
                }
                this.ball.position.y = minY + this.BALL_RADIUS; // Position ball so its bottom touches boundary
                this.ballVelocity.y = 0; // Stop vertical movement completely
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to bottom boundary - CANNOT ESCAPE');
                }
            } else if (this.ball.position.y + this.BALL_RADIUS > maxY) {
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit top boundary at y =', this.ball.position.y, 'constraining to', maxY - this.BALL_RADIUS);
                }
                this.ball.position.y = maxY - this.BALL_RADIUS; // Position ball so its top touches boundary
                this.ballVelocity.y = 0; // Stop vertical movement completely
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to top boundary - CANNOT ESCAPE');
                }
            }
            
            // CRITICAL: Keep ball sphere within Z boundaries - ball CANNOT escape the box
            if (this.ball.position.z - this.BALL_RADIUS < minZ) {
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit back boundary at z =', this.ball.position.z, 'constraining to', minZ + this.BALL_RADIUS);
                }
                this.ball.position.z = minZ + this.BALL_RADIUS; // Position ball so its back edge touches boundary
                this.ballVelocity.z = 0; // Stop forward movement completely
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to back boundary - CANNOT ESCAPE');
                }
            } else if (this.ball.position.z + this.BALL_RADIUS > maxZ) {
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball hit front boundary at z =', this.ball.position.z, 'constraining to', maxZ - this.BALL_RADIUS);
                }
                this.ball.position.z = maxZ - this.BALL_RADIUS; // Position ball so its front edge touches boundary
                this.ballVelocity.z = 0; // Stop backward movement completely
                if (!this.ballLanded) {
                    console.log('*** BOUNDARY CONSTRAINT APPLIED *** Ball constrained to front boundary - CANNOT ESCAPE');
                }
            }
        }
    }
    
    checkGoalArea() {
        if (!this.ball || !this.goalPost) return false;
        
        // Goal area dimensions (same as the red collision box)
        const goalCenterZ = -115; // Updated to match red collision box position
        const goalWidth = 33; // Width of the red box
        const goalHeight = 11; // Height of the red box
        const goalDepth = 8; // Depth of the red box (z = -113 to -105)
        
        const ballPos = this.ball.position;
        
        // Check if ball is in the goal area (overlapping zone)
        const inGoalX = Math.abs(ballPos.x) <= goalWidth / 2;
        const inGoalY = ballPos.y >= 0 && ballPos.y <= goalHeight;
        const inGoalZ = ballPos.z >= goalCenterZ - goalDepth/2 && ballPos.z <= goalCenterZ + goalDepth/2;
        
        // Minimal logging - only when ball enters goal area
        if (inGoalX && inGoalY && inGoalZ) {
            console.log('*** BALL IS IN GOAL AREA ***');
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
        const minY = this.GROUND_LEVEL; // Use true ground level
        const maxY = goalHeight;      // 11
        const minZ = goalCenterZ - goalDepth / 2;  // -113
        const maxZ = goalCenterZ + goalDepth / 2;  // -105
        
        // Minimal logging
        
        // CRITICAL: Keep ball sphere within X boundaries - ball CANNOT escape
        if (this.ball.position.x - this.BALL_RADIUS < minX) {
            this.ball.position.x = minX + this.BALL_RADIUS; // Position ball so its left edge touches boundary
            this.ballVelocity.x = 0;
        } else if (this.ball.position.x + this.BALL_RADIUS > maxX) {
            this.ball.position.x = maxX - this.BALL_RADIUS; // Position ball so its right edge touches boundary
            this.ballVelocity.x = 0;
        }
        
        // CRITICAL: Keep ball sphere within Y boundaries - ball CANNOT escape
        // Use bounding box center to get actual ball center position
        const box = new THREE.Box3().setFromObject(this.ball);
        const ballCenterY = box.getCenter(new THREE.Vector3()).y;
        
        if (ballCenterY - this.BALL_RADIUS < minY) {
            // Adjust ball position so the actual center is at the right height
            const offsetY = ballCenterY - this.ball.position.y; // Offset between model position and actual center
            this.ball.position.y = minY + this.BALL_RADIUS - offsetY; // Position ball so its bottom touches boundary
            this.ballVelocity.y = 0;
        } else if (ballCenterY + this.BALL_RADIUS > maxY) {
            // Adjust ball position so the actual center is at the right height
            const offsetY = ballCenterY - this.ball.position.y; // Offset between model position and actual center
            this.ball.position.y = maxY - this.BALL_RADIUS - offsetY; // Position ball so its top touches boundary
            this.ballVelocity.y = 0;
        }
        
        if (this.ball.position.z - this.BALL_RADIUS < minZ) {
            this.ball.position.z = minZ + this.BALL_RADIUS; // Position ball so its back edge touches boundary
            this.ballVelocity.z = 0;
        } else if (this.ball.position.z + this.BALL_RADIUS > maxZ) {
            this.ball.position.z = maxZ - this.BALL_RADIUS; // Position ball so its front edge touches boundary
            this.ballVelocity.z = 0;
        }
        
        // Check if ball has slowed down enough to consider it "scored"
        if (this.ballVelocity.length() < 0.1 && !this.goalScored) {
            console.log('GOAL SCORED!');
            
            // Set goal scored flag
            this.goalScored = true;
            
            // Play crowd cheering sound for goal
            this.playCrowdCheering();
            
            // Stop the ball completely
            this.ballVelocity.set(0, 0, 0);
            
            // Position ball on the ground in the goal area
            // Use bounding box center to get actual ball center position, then adjust
            const box = new THREE.Box3().setFromObject(this.ball);
            const ballCenterY = box.getCenter(new THREE.Vector3()).y;
            const offsetY = ballCenterY - this.ball.position.y; // Offset between model position and actual center
            this.ball.position.y = this.GROUND_LEVEL + this.BALL_RADIUS - offsetY; // Position ball so its bottom touches ground
            
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
        const minY = this.GROUND_LEVEL; // Use true ground level
        const maxY = goalHeight;      // 11
        const minZ = goalCenterZ - goalDepth / 2;  // -113
        const maxZ = goalCenterZ + goalDepth / 2;  // -105
        
        // Force ball sphere to stay within boundaries - NO EXCEPTIONS
        if (this.ball.position.x - this.BALL_RADIUS < minX) {
            if (!this.ballLanded) {
                console.log('SAFETY: Ball at x =', this.ball.position.x, 'forced back to left boundary', minX + this.BALL_RADIUS);
            }
            this.ball.position.x = minX + this.BALL_RADIUS; // Position ball so its left edge touches boundary
            this.ballVelocity.x = 0;
            if (!this.ballLanded) {
                console.log('SAFETY: Ball forced back to left boundary');
            }
        } else if (this.ball.position.x + this.BALL_RADIUS > maxX) {
            if (!this.ballLanded) {
                console.log('SAFETY: Ball at x =', this.ball.position.x, 'forced back to right boundary', maxX - this.BALL_RADIUS);
            }
            this.ball.position.x = maxX - this.BALL_RADIUS; // Position ball so its right edge touches boundary
            this.ballVelocity.x = 0;
            if (!this.ballLanded) {
                console.log('SAFETY: Ball forced back to right boundary');
            }
        }
        
        if (this.ball.position.y - this.BALL_RADIUS < minY) {
            this.ball.position.y = minY + this.BALL_RADIUS; // Position ball so its bottom touches boundary
            this.ballVelocity.y = 0;
            if (!this.ballLanded) {
                console.log('SAFETY: Ball forced back to bottom boundary');
            }
        } else if (this.ball.position.y + this.BALL_RADIUS > maxY) {
            this.ball.position.y = maxY - this.BALL_RADIUS; // Position ball so its top touches boundary
            this.ballVelocity.y = 0;
            if (!this.ballLanded) {
                console.log('SAFETY: Ball forced back to top boundary');
            }
        }
        
        if (this.ball.position.z - this.BALL_RADIUS < minZ) {
            this.ball.position.z = minZ + this.BALL_RADIUS; // Position ball so its back edge touches boundary
            this.ballVelocity.z = 0;
            if (!this.ballLanded) {
                console.log('SAFETY: Ball forced back to back boundary');
            }
        } else if (this.ball.position.z + this.BALL_RADIUS > maxZ) {
            this.ball.position.z = maxZ - this.BALL_RADIUS; // Position ball so its front edge touches boundary
            this.ballVelocity.z = 0;
            if (!this.ballLanded) {
                console.log('SAFETY: Ball forced back to front boundary');
            }
        }
    }
    
    resetBall() {
        if (!this.ball) return;
        
        console.log('=== RESET BALL ===');
        console.log('Quiz active:', this.quizActive);
        
        // Set initial ball position
        const targetX = -3.9;
        const targetZ = -56.25;
        const targetModelY = this.BALL_RADIUS - 0.6; // Initial Y position
        
        this.ball.position.set(targetX, targetModelY, targetZ);
        
        // Update collision sphere to get accurate center position
        if (!this.ballCollisionSphere && this.showCollisionSphere) {
            this.createBallCollisionSphere();
        } else {
            this.updateBallCollisionSphere();
        }
        
        // Calculate actual ball center using bounding box
        const box = new THREE.Box3().setFromObject(this.ball);
        const ballCenter = box.getCenter(new THREE.Vector3());
        const offsetY = ballCenter.y - this.ball.position.y;
        
        console.log('Ball model position:', this.ball.position);
        console.log('Ball bounding box center:', ballCenter);
        console.log('Y offset between model and center:', offsetY.toFixed(3));
        console.log('Ball center Y before adjustment:', ballCenter.y.toFixed(3));
        
        // Check if ball center would be below ground and adjust if needed
        const minBallCenterY = this.GROUND_LEVEL + this.BALL_RADIUS; // Ball center must be at least BALL_RADIUS above ground
        if (ballCenter.y < minBallCenterY) {
            const adjustment = minBallCenterY - ballCenter.y;
            this.ball.position.y += adjustment;
            console.log('ADJUSTED ball position upward by:', adjustment.toFixed(3));
            console.log('New ball model position Y:', this.ball.position.y.toFixed(3));
            
            // Recalculate to verify
            const boxAfter = new THREE.Box3().setFromObject(this.ball);
            const ballCenterAfter = boxAfter.getCenter(new THREE.Vector3());
            console.log('Ball center Y after adjustment:', ballCenterAfter.y.toFixed(3));
            console.log('Expected center Y:', minBallCenterY.toFixed(3));
            
            // Update collision sphere again with corrected position
            this.updateBallCollisionSphere();
        }
        
        this.ballVelocity.set(0, 0, 0);
        this.ballKicked = false;
        this.ballStopTimer = 0;
        this.goalScored = false;
        this.ballLanded = false; // Reset landing flag
        this.ballAttachedToGoalie = false; // Reset attachment flag
        this.ballBouncedOffGoalie = false; // Reset bounce flag
        
        // Reset quiz state for next question (only if not in quiz mode)
        if (!this.quizActive) {
            this.quizAnswered = false;
            this.quizCorrect = false;
        }
        
        // Reset goalie collision box to default position
        this.resetGoalieCollisionBox();
        
        this.resetCharacter();
    }
    
    resetCharacter() {
        if (!this.model) {
        // Character reset
            return;
        }
        
        // Character reset
        this.model.position.set(-7, 0, -50); // Match the original starting position
        this.model.rotation.y = Math.PI; // Face the goal
        // Character reset complete
    }
    
    resetGame() {
        // Game reset
        this.resetBall();
        this.resetCharacter();
    }
    
    loadGoalie() {
        const loader = new GLTFLoader();
        this.setupDracoLoader(loader);
        
        loader.load(
            'character/ch_goalie.glb',
            (gltf) => {
                console.log('Goalie model loaded successfully:', gltf);
                this.goalie = gltf.scene;
                
                // Enable shadows and improve materials for the goalie
                this.goalie.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Improve material properties for better visibility and shadow compatibility
                        if (child.material) {
                            // Ensure material is shadow-compatible
                            if (child.material.isMeshBasicMaterial) {
                                // Convert BasicMaterial to LambertMaterial for shadows
                                const newMaterial = new THREE.MeshLambertMaterial({
                                    color: child.material.color,
                                    map: child.material.map,
                                    transparent: child.material.transparent,
                                    opacity: child.material.opacity
                                });
                                child.material = newMaterial;
                            }
                            
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
                
                // Center the goalie model
                const box = new THREE.Box3().setFromObject(this.goalie);
                const center = box.getCenter(new THREE.Vector3());
                this.goalie.position.sub(center);
                
                // Scale the goalie to 4.0x size (even bigger goalie)
                this.goalie.scale.setScalar(4.0);
                
                // Position goalie in front of the goalie box
                // Goal center is at z = -109, goal depth is 8, so front of goal is at z = -105
                // Position goalie slightly in front of the goal
                this.goalie.position.set(0, 0, -100); // Center of goal, slightly in front
                
                // Rotate goalie to face the player (opposite direction from the main character)
                this.goalie.rotation.y = 0; // Face towards the player
                
                // Set up goalie animations
                this.setupGoalieAnimations(gltf);
                
                this.scene.add(this.goalie);
                
                // Create visual collision box for goalie
                this.createGoalieCollisionBox();
                
                console.log('Goalie positioned in front of goalie box');
                
                // Update stats
                this.updateStats();
            },
            (progress) => {
                console.log('Goalie loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading goalie model:', error);
            }
        );
    }
    
    createGoalieCollisionBox() {
        // Create a wireframe box to show the goalie's collision area
        const collisionGeometry = new THREE.BoxGeometry(8, 6, 2); // Width, Height, Depth
        const collisionMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Green color
            wireframe: true,
            transparent: true,
            opacity: 0.7
        });
        
        this.goalieCollisionBox = new THREE.Mesh(collisionGeometry, collisionMaterial);
        
        // Position collision box at goalie's position
        this.goalieCollisionBox.position.copy(this.goalie.position);
        
        // Make it slightly above ground level
        this.goalieCollisionBox.position.y += 3;
        
        // Hide the goalie collision box (make it invisible)
        this.goalieCollisionBox.visible = false;
        
        this.scene.add(this.goalieCollisionBox);
        
        console.log('Goalie collision box created - Hidden green wireframe rectangle');
    }
    
    loadStadium() {
        const loader = new GLTFLoader();
        this.setupDracoLoader(loader);
        
        loader.load(
            'character/low_poly_stadium.glb',
            (gltf) => {
                console.log('Stadium model loaded successfully:', gltf);
                this.stadium = gltf.scene;
                
                // Enable shadows for the stadium and hide incorrect penalty box
                this.stadium.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Improve materials for better lighting
                        if (child.material) {
                            child.material.shininess = 30;
                        }
                        
                        // Check if this might be the field mesh and hide it if it's causing issues
                        if (child.material && child.material.color) {
                            const color = child.material.color.getHex();
                            // Hide Object_4 which appears to be the field (green color #227833)
                            if (child.name === 'Object_4' || color === 0x227833) {
                                console.log('Hiding field mesh:', child.name, 'Color:', '#' + color.toString(16).padStart(6, '0'));
                                child.visible = false;
                            }
                        }
                    }
                });
                
                // Position the stadium to contain the entire field
                this.stadium.position.set(0, 0, 0); // Center the stadium
                this.stadium.scale.set(10, 10, 10); // Scale much bigger to contain the field
                
                // No rotation needed - stadium should be properly oriented
                
                this.scene.add(this.stadium);
                
                console.log('Stadium positioned to contain the field');
                
                // Update stats
                this.updateStats();
            },
            (progress) => {
                console.log('Stadium loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading stadium model:', error);
            }
        );
    }
    
    createBallCollisionSphere() {
        if (!this.ball) return;
        
        // Create a wireframe sphere to show collision boundaries
        const sphereGeometry = new THREE.SphereGeometry(this.BALL_RADIUS, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, // Bright green
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.ballCollisionSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Calculate ball's bounding box to get the actual center
        const box = new THREE.Box3().setFromObject(this.ball);
        const center = box.getCenter(new THREE.Vector3());
        
        // Position collision sphere at the ball's actual geometric center
        this.ballCollisionSphere.position.copy(center);
        
        // Set visibility based on showCollisionSphere flag
        this.ballCollisionSphere.visible = this.showCollisionSphere;
        
        // Add to scene
        this.scene.add(this.ballCollisionSphere);
        
        console.log('Ball collision sphere created with radius:', this.BALL_RADIUS);
        console.log('Ball position:', this.ball.position);
        console.log('Ball bounding box center:', center);
        console.log('Collision sphere position:', this.ballCollisionSphere.position);
    }
    
    updateBallCollisionSphere() {
        if (!this.ballCollisionSphere || !this.ball) return;
        
        // Calculate ball's bounding box to get the actual center
        const box = new THREE.Box3().setFromObject(this.ball);
        const center = box.getCenter(new THREE.Vector3());
        
        // Update collision sphere position to match ball's actual geometric center
        this.ballCollisionSphere.position.copy(center);
    }
    
    toggleCollisionSphere() {
        if (!this.ballCollisionSphere) {
            this.createBallCollisionSphere();
        } else {
            this.ballCollisionSphere.visible = !this.ballCollisionSphere.visible;
            console.log('Collision sphere visibility:', this.ballCollisionSphere.visible);
        }
    }
    
    debugBallBounds() {
        if (!this.ball) return;
        
        // Calculate ball's bounding box
        const box = new THREE.Box3().setFromObject(this.ball);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('=== BALL BOUNDS DEBUG ===');
        console.log('Ball position:', this.ball.position);
        console.log('Ball bounding box center:', center);
        console.log('Ball bounding box size:', size);
        console.log('Ball scale:', this.ball.scale);
        console.log('Collision sphere radius:', this.BALL_RADIUS);
        console.log('Collision sphere position:', this.ballCollisionSphere ? this.ballCollisionSphere.position : 'Not created');
        
        // Create a visual bounding box
        const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const boxMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Red
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        
        const boundingBoxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        boundingBoxMesh.position.copy(center);
        boundingBoxMesh.name = 'ballBoundingBox';
        
        // Remove existing bounding box if it exists
        const existingBox = this.scene.getObjectByName('ballBoundingBox');
        if (existingBox) {
            this.scene.remove(existingBox);
        }
        
        this.scene.add(boundingBoxMesh);
        console.log('Red bounding box added to show ball bounds');
    }
    
    loadBall() {
        console.log('Loading ball.glb model...');
        
        const loader = new GLTFLoader();
        this.setupDracoLoader(loader);
        
        loader.load(
            'character/ball.glb',
            (gltf) => {
                console.log('Ball model loaded successfully');
                
                // Use the loaded model as the ball
                this.ball = gltf.scene;
                
                // Position the ball (lowered more to better align with collision sphere)
                this.ball.position.set(-3.9, this.BALL_RADIUS - 0.6, -56.25);
                
                // Scale the ball appropriately - make it much bigger
                this.ball.scale.set(7, 7, 7);
                
                // Enable shadows
                this.ball.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Add to scene
                this.scene.add(this.ball);
                
                console.log('Ball.glb model added to scene');
                
                // Create collision sphere visualizer
                if (this.showCollisionSphere) {
                    this.createBallCollisionSphere();
                }
            },
            (progress) => {
                console.log('Ball loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading ball model:', error);
                
                // Fallback: create a simple sphere if GLB fails
                console.log('Creating fallback sphere ball...');
                const ballGeometry = new THREE.SphereGeometry(1, 16, 16);
                const ballMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.9
                });
                this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
                this.ball.position.set(-3.9, this.BALL_RADIUS - 0.6, -56.25);
                this.ball.castShadow = true;
                this.ball.receiveShadow = true;
                this.scene.add(this.ball);
                console.log('Fallback sphere ball created');
                
                // Create collision sphere visualizer
                if (this.showCollisionSphere) {
                    this.createBallCollisionSphere();
                }
            }
        );
    }
    
    setupGoalieAnimations(gltf) {
        if (gltf.animations && gltf.animations.length > 0) {
            console.log('Found goalie animations:', gltf.animations.length);
            
            // Create animation mixer for goalie
            this.goalieMixer = new THREE.AnimationMixer(this.goalie);
            
            // Store all goalie animations
            this.goalieAnimations = gltf.animations;
            
            // Find idle animation for goalie
            this.goalieIdleAnimation = this.findGoalieAnimationByName(['idle', 'Idle', 'IDLE', 'standing', 'Standing']);
            
            // Find save animations for goalie
            this.goalieSaveLAnimation = this.findGoalieAnimationByName(['save_L', 'save_l', 'Save_L', 'SAVE_L', 'dive_left', 'Dive_Left']);
            this.goalieSaveRAnimation = this.findGoalieAnimationByName(['save_R', 'save_r', 'Save_R', 'SAVE_R', 'dive_right', 'Dive_Right']);
            
            // If we can't find by name, use first animation as idle
            if (!this.goalieIdleAnimation && this.goalieAnimations.length > 0) {
                this.goalieIdleAnimation = this.goalieAnimations[0];
            }
            
            // Start with idle animation
            if (this.goalieIdleAnimation) {
                this.goalieCurrentAnimation = this.goalieMixer.clipAction(this.goalieIdleAnimation);
                this.goalieCurrentAnimation.play();
                this.goalieCurrentAnimation.setEffectiveTimeScale(1.0);
                console.log('Playing goalie idle animation:', this.goalieIdleAnimation.name || 'Unnamed');
            }
            
            // Log all available goalie animations
            console.log('Available goalie animations:');
            this.goalieAnimations.forEach((clip, index) => {
                const type = clip === this.goalieIdleAnimation ? ' (IDLE)' : 
                           clip === this.goalieSaveLAnimation ? ' (SAVE_L)' :
                           clip === this.goalieSaveRAnimation ? ' (SAVE_R)' : '';
                console.log(`${index}: ${clip.name || 'Unnamed'}${type}`);
            });
            
            console.log('Goalie idle animation:', this.goalieIdleAnimation?.name || 'Not found');
            console.log('Goalie save_L animation:', this.goalieSaveLAnimation?.name || 'Not found');
            console.log('Goalie save_R animation:', this.goalieSaveRAnimation?.name || 'Not found');
            
        } else {
            console.log('No animations found in goalie GLB file');
        }
    }
    
    findGoalieAnimationByName(names) {
        for (const name of names) {
            const animation = this.goalieAnimations.find(clip => 
                clip.name && clip.name.toLowerCase().includes(name.toLowerCase())
            );
            if (animation) return animation;
        }
        return null;
    }
    
    playGoalieSaveAnimation(ballDirection) {
        console.log('=== GOALIE SAVE ANIMATION DEBUG ===');
        console.log('goalieMixer exists:', !!this.goalieMixer);
        console.log('goalieSaveLAnimation exists:', !!this.goalieSaveLAnimation);
        console.log('goalieSaveRAnimation exists:', !!this.goalieSaveRAnimation);
        console.log('Ball direction:', ballDirection.x.toFixed(3), ballDirection.y.toFixed(3), ballDirection.z.toFixed(3));
        
        if (!this.goalieMixer) {
            console.log('❌ No goalie mixer found!');
            return;
        }
        
        // Determine which save animation to play based on ball direction
        let saveAnimation = null;
        let animationName = '';
        
        if (ballDirection.x < -0.1) { // Ball going left
            saveAnimation = this.goalieSaveLAnimation;
            animationName = 'save_L';
            console.log('🎯 Ball going LEFT - using save_L animation');
        } else if (ballDirection.x > 0.1) { // Ball going right
            saveAnimation = this.goalieSaveRAnimation;
            animationName = 'save_R';
            console.log('🎯 Ball going RIGHT - using save_R animation');
        } else {
            console.log('🎯 Ball going CENTER - no save animation needed');
        }
        
        if (saveAnimation) {
            console.log('✅ Playing goalie', animationName, 'animation');
            
            // Stop current animation
            if (this.goalieCurrentAnimation) {
                this.goalieCurrentAnimation.stop();
            }
            
            // Play save animation at double speed
            this.goalieCurrentAnimation = this.goalieMixer.clipAction(saveAnimation);
            this.goalieCurrentAnimation.reset();
            this.goalieCurrentAnimation.setLoop(THREE.LoopOnce);
            this.goalieCurrentAnimation.setEffectiveTimeScale(2.0); // Double speed
            this.goalieCurrentAnimation.play();
            
            console.log('✅ Goalie save animation started');
            
            // Return to idle after save animation completes (faster due to double speed)
            setTimeout(() => {
                if (this.goalieIdleAnimation && this.goalieMixer) {
                    console.log('🔄 Returning goalie to idle animation');
                    this.goalieCurrentAnimation = this.goalieMixer.clipAction(this.goalieIdleAnimation);
                    this.goalieCurrentAnimation.reset();
                    this.goalieCurrentAnimation.play();
                }
            }, 1000); // 1 second for double-speed save animation
        } else {
            console.log('❌ No save animation found for ball direction:', ballDirection.x);
            console.log('Available animations:', this.goalieAnimations?.map(a => a.name) || 'None');
        }
    }
    
    playGoalieMoveAwayAnimation(ballDirection) {
        console.log('=== GOALIE MOVE AWAY ANIMATION ===');
        console.log('Ball direction:', ballDirection.x.toFixed(3), ballDirection.y.toFixed(3), ballDirection.z.toFixed(3));
        
        if (!this.goalieMixer) {
            console.log('❌ No goalie mixer found!');
            return;
        }
        
        // Determine which direction to move away from the ball
        let moveAwayAnimation = null;
        let animationName = '';
        
        if (ballDirection.x < -0.1) { // Ball going left, move goalie right
            moveAwayAnimation = this.goalieSaveRAnimation; // Use right save animation to move right
            animationName = 'move_right_away';
            console.log('🎯 Ball going LEFT - goalie moving RIGHT away');
        } else if (ballDirection.x > 0.1) { // Ball going right, move goalie left
            moveAwayAnimation = this.goalieSaveLAnimation; // Use left save animation to move left
            animationName = 'move_left_away';
            console.log('🎯 Ball going RIGHT - goalie moving LEFT away');
        } else {
            // Ball going straight, randomly pick a direction
            const randomDirection = Math.random() > 0.5;
            if (randomDirection) {
                moveAwayAnimation = this.goalieSaveLAnimation;
                animationName = 'move_left_away';
                console.log('🎯 Ball going STRAIGHT - goalie moving LEFT away (random)');
            } else {
                moveAwayAnimation = this.goalieSaveRAnimation;
                animationName = 'move_right_away';
                console.log('🎯 Ball going STRAIGHT - goalie moving RIGHT away (random)');
            }
        }
        
        if (moveAwayAnimation) {
            console.log('✅ Playing goalie', animationName, 'animation');
            
            // Stop current animation
            if (this.goalieCurrentAnimation) {
                this.goalieCurrentAnimation.stop();
            }
            
            // Play move away animation at double speed (same as save animation)
            this.goalieCurrentAnimation = this.goalieMixer.clipAction(moveAwayAnimation);
            this.goalieCurrentAnimation.reset();
            this.goalieCurrentAnimation.setLoop(THREE.LoopOnce);
            this.goalieCurrentAnimation.setEffectiveTimeScale(2.0); // Double speed (same as save)
            this.goalieCurrentAnimation.play();
            
            console.log('Goalie move away animation started at double speed');
            
            // Return to idle after move away animation completes (faster due to double speed)
            setTimeout(() => {
                if (this.goalieIdleAnimation && this.goalieMixer) {
                    console.log('🔄 Returning goalie to idle after moving away');
                    this.goalieCurrentAnimation = this.goalieMixer.clipAction(this.goalieIdleAnimation);
                    this.goalieCurrentAnimation.reset();
                    this.goalieCurrentAnimation.play();
                }
            }, 1000); // 1 second for double-speed move away animation
        } else {
            console.log('❌ No move away animation found');
        }
    }
    
    checkGoalieCollision() {
        if (!this.ball || !this.goalie || !this.goalieCurrentAnimation || !this.goalieCollisionBox) return false;
        
        // QUIZ INTEGRATION: If quiz is active and answer is correct, goalie doesn't save
        if (this.quizActive && this.quizAnswered && this.quizCorrect) {
            console.log('🎯 CORRECT ANSWER! Goalie lets the ball through!');
            return false; // No collision = goalie doesn't save
        }
        
        // Only check collision during save animations (not idle)
        const isSaveAnimation = this.goalieCurrentAnimation === this.goalieMixer.clipAction(this.goalieSaveLAnimation) ||
                               this.goalieCurrentAnimation === this.goalieMixer.clipAction(this.goalieSaveRAnimation);
        
        if (!isSaveAnimation) return false;
        
        // Move collision box with goalie during save animations
        this.updateGoalieCollisionBox();
        
        // Check if ball sphere intersects with the collision box
        const ballPos = this.ball.position;
        const boxPos = this.goalieCollisionBox.position;
        
        // Box dimensions (half-widths)
        const boxWidth = 4;   // Half of 8
        const boxHeight = 3;  // Half of 6
        const boxDepth = 1;   // Half of 2
        
        // Calculate closest point on box to ball center
        const closestX = Math.max(boxPos.x - boxWidth, Math.min(ballPos.x, boxPos.x + boxWidth));
        const closestY = Math.max(boxPos.y - boxHeight, Math.min(ballPos.y, boxPos.y + boxHeight));
        const closestZ = Math.max(boxPos.z - boxDepth, Math.min(ballPos.z, boxPos.z + boxDepth));
        
        // Calculate distance from ball center to closest point on box
        const distanceX = ballPos.x - closestX;
        const distanceY = ballPos.y - closestY;
        const distanceZ = ballPos.z - closestZ;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ;
        
        // Check if ball sphere intersects with box
        const inBox = distanceSquared <= (this.BALL_RADIUS * this.BALL_RADIUS);
        
        if (inBox && !this.ballBouncedOffGoalie) {
            console.log('🎯 GOALIE DEFLECT! Ball hit goalie collision box');
            this.ballBouncedOffGoalie = true; // Prevent multiple bounces
            return true;
        }
        
        return false;
    }
    
    updateGoalieCollisionBox() {
        if (!this.goalieCollisionBox || !this.goalie) return;
        
        // Move collision box with goalie during save animations
        const goaliePos = this.goalie.position;
        
        // Determine save direction and adjust collision box position
        if (this.goalieCurrentAnimation === this.goalieMixer.clipAction(this.goalieSaveLAnimation)) {
            // Move collision box to the left during left save
            this.goalieCollisionBox.position.set(
                goaliePos.x - 10, // Move left 10 units
                goaliePos.y + 3, // Keep height
                goaliePos.z + 5  // Move forward 5 units
            );
        } else if (this.goalieCurrentAnimation === this.goalieMixer.clipAction(this.goalieSaveRAnimation)) {
            // Move collision box to the right during right save
            this.goalieCollisionBox.position.set(
                goaliePos.x + 10, // Move right 10 units
                goaliePos.y + 3, // Keep height
                goaliePos.z + 5  // Move forward 5 units
            );
        } else {
            // Default position during idle
            this.goalieCollisionBox.position.set(
                goaliePos.x,
                goaliePos.y + 3,
                goaliePos.z + 1
            );
        }
    }
    
    resetGoalieCollisionBox() {
        if (!this.goalieCollisionBox || !this.goalie) return;
        
        // Reset collision box to default centered position
        const goaliePos = this.goalie.position;
        this.goalieCollisionBox.position.set(
            goaliePos.x,      // Centered on goalie
            goaliePos.y + 3,  // 3 units above goalie
            goaliePos.z + 1   // Slightly forward
        );
        
        console.log('🔄 Goalie collision box reset to default position');
    }
    
    handleGoalieSave() {
        if (!this.ball) return;
        
        console.log('🏆 GOALIE DEFLECTED THE BALL!');
        
        // Play crowd missed sound when goalie saves the ball
        this.playCrowdMissed();
        
        // Calculate bounce direction based on which side the goalie is saving
        let bounceDirection = new THREE.Vector3();
        
        if (this.goalieCurrentAnimation === this.goalieMixer.clipAction(this.goalieSaveLAnimation)) {
            // Left save - bounce ball to the left
            bounceDirection.set(-1, 0.3, 0.5); // Left, slightly up, forward
        } else if (this.goalieCurrentAnimation === this.goalieMixer.clipAction(this.goalieSaveRAnimation)) {
            // Right save - bounce ball to the right
            bounceDirection.set(1, 0.3, 0.5); // Right, slightly up, forward
        } else {
            // Default bounce - straight back
            bounceDirection.set(0, 0.2, 1); // Straight back, slightly up
        }
        
        // Normalize and apply bounce force
        bounceDirection.normalize();
        const bouncePower = 1.2; // Bounce strength
        this.ballVelocity.set(
            bounceDirection.x * bouncePower,
            bounceDirection.y * bouncePower,
            bounceDirection.z * bouncePower
        );
        
        console.log('Ball bounced with velocity:', this.ballVelocity.x.toFixed(2), this.ballVelocity.y.toFixed(2), this.ballVelocity.z.toFixed(2));
    }
    
    loadKickSound() {
        console.log('=== LOADING KICK SOUND FUNCTION CALLED ===');
        console.log('=== LOADING KICK SOUND ===');
        console.log('Attempting to load: sounds/ball_kick.mp3');
        
        // First try HTML5 audio as a fallback
        this.html5KickSound = new Audio('sounds/ball_kick.mp3');
        this.html5KickSound.volume = 0.5;
        this.html5KickSound.preload = 'auto';
        
        console.log('HTML5 Audio object created:', this.html5KickSound);
        console.log('Audio src:', this.html5KickSound.src);
        
        // Test if HTML5 audio loads
        this.html5KickSound.addEventListener('canplaythrough', () => {
            console.log('✅ HTML5 audio loaded successfully');
            console.log('Audio duration:', this.html5KickSound.duration);
        });
        
        this.html5KickSound.addEventListener('error', (e) => {
            console.error('❌ HTML5 audio error:', e);
            console.error('Error details:', e.target.error);
        });
        
        this.html5KickSound.addEventListener('loadstart', () => {
            console.log('🔄 HTML5 audio loading started');
        });
        
        // Also try Three.js audio loader
        console.log('Attempting Three.js audio loader...');
        const audioLoader = new THREE.AudioLoader();
        
        // Load the kick sound
        audioLoader.load('sounds/ball_kick.mp3', (audioBuffer) => {
            console.log('✅ Three.js kick sound loaded successfully');
            
            // Create audio listener and add to camera
            const audioListener = new THREE.AudioListener();
            this.camera.add(audioListener);
            
            // Create simple audio (not positional) for now
            this.kickSound = new THREE.Audio(audioListener);
            this.kickSound.setBuffer(audioBuffer);
            this.kickSound.setVolume(0.5); // Set volume to 50%
            
            console.log('✅ Three.js kick sound setup complete');
        }, (progress) => {
            console.log('🔄 Loading Three.js kick sound progress:', (progress.loaded / progress.total * 100) + '%');
        }, (error) => {
            console.error('❌ Error loading Three.js kick sound:', error);
        });
        
        console.log('=== KICK SOUND LOADING INITIATED ===');
    }
    
    loadBackgroundMusic() {
        console.log('=== LOADING BACKGROUND MUSIC ===');
        console.log('Attempting to load: sounds/bg_music.mp3');
        
        // Create HTML5 audio for background music
        this.bgMusic = new Audio('sounds/bg_music.mp3');
        this.bgMusic.volume = 0.3; // Lower volume for background music
        this.bgMusic.loop = true; // Loop the background music
        this.bgMusic.preload = 'auto';
        
        console.log('Background music object created:', this.bgMusic);
        console.log('Audio src:', this.bgMusic.src);
        
        // Test if background music loads
        this.bgMusic.addEventListener('canplaythrough', () => {
            console.log('✅ Background music loaded successfully');
            console.log('Music duration:', this.bgMusic.duration);
            this.bgMusicLoaded = true;
        });
        
        this.bgMusic.addEventListener('error', (e) => {
            console.error('❌ Error loading background music:', e);
            console.error('Error details:', e.target.error);
        });
        
        console.log('=== BACKGROUND MUSIC LOADING INITIATED ===');
    }
    
    playBackgroundMusic() {
        if (!this.bgMusic || !this.bgMusicLoaded || this.bgMusicPlaying) return;
        
        console.log('🎵 Starting background music...');
        this.bgMusic.play().then(() => {
            this.bgMusicPlaying = true;
            console.log('✅ Background music started successfully');
        }).catch((error) => {
            console.error('❌ Error playing background music:', error);
        });
    }
    
    stopBackgroundMusic() {
        if (!this.bgMusic || !this.bgMusicPlaying) return;
        
        console.log('🔇 Stopping background music...');
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        this.bgMusicPlaying = false;
        console.log('✅ Background music stopped');
    }
    
    loadCrowdCheering() {
        console.log('=== LOADING CROWD CHEERING ===');
        console.log('Attempting to load: sounds/crowd-cheering.mp3');
        
        // Create HTML5 audio for crowd cheering
        this.crowdCheering = new Audio('sounds/crowd-cheering.mp3');
        this.crowdCheering.volume = 0.7; // Higher volume for celebration
        this.crowdCheering.preload = 'auto';
        
        console.log('Crowd cheering object created:', this.crowdCheering);
        console.log('Audio src:', this.crowdCheering.src);
        
        // Test if crowd cheering loads
        this.crowdCheering.addEventListener('canplaythrough', () => {
            console.log('✅ Crowd cheering loaded successfully');
            console.log('Cheering duration:', this.crowdCheering.duration);
            this.crowdCheeringLoaded = true;
        });
        
        this.crowdCheering.addEventListener('error', (e) => {
            console.error('❌ Error loading crowd cheering:', e);
            console.error('Error details:', e.target.error);
        });
        
        console.log('=== CROWD CHEERING LOADING INITIATED ===');
    }
    
    playCrowdCheering() {
        if (!this.crowdCheering || !this.crowdCheeringLoaded) return;
        
        console.log('🎉 Playing crowd cheering for goal!');
        this.crowdCheering.currentTime = 0; // Reset to beginning
        this.crowdCheering.play().then(() => {
            console.log('✅ Crowd cheering played successfully');
        }).catch((error) => {
            console.error('❌ Error playing crowd cheering:', error);
        });
    }
    
    loadCrowdMissed() {
        console.log('=== LOADING CROWD MISSED SOUND ===');
        console.log('Attempting to load: sounds/crowd-missed.mp3');
        
        // Create HTML5 audio for crowd missed sound
        this.crowdMissed = new Audio('sounds/crowd-missed.mp3');
        this.crowdMissed.volume = 0.7; // Same volume as cheering
        this.crowdMissed.preload = 'auto';
        
        console.log('Crowd missed object created:', this.crowdMissed);
        console.log('Audio src:', this.crowdMissed.src);
        
        // Test if crowd missed loads
        this.crowdMissed.addEventListener('canplaythrough', () => {
            console.log('✅ Crowd missed sound loaded successfully');
            console.log('Missed duration:', this.crowdMissed.duration);
            this.crowdMissedLoaded = true;
        });
        
        this.crowdMissed.addEventListener('error', (e) => {
            console.error('❌ Error loading crowd missed sound:', e);
            console.error('Error details:', e.target.error);
        });
        
        console.log('=== CROWD MISSED SOUND LOADING INITIATED ===');
    }
    
    playCrowdMissed() {
        if (!this.crowdMissed || !this.crowdMissedLoaded) {
            console.log('⚠️ Crowd missed sound not available');
            return;
        }
        
        console.log('😞 Playing crowd missed sound for goalie save!');
        this.crowdMissed.currentTime = 0; // Reset to beginning
        this.crowdMissed.play().then(() => {
            console.log('✅ Crowd missed sound played successfully');
        }).catch((error) => {
            console.error('❌ Error playing crowd missed sound:', error);
        });
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
        // Reduced key logging
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Event listeners set up
    }
    
    handleKeyDown(event) {
        // Reduced key logging
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
                console.log('Space key pressed - checking ball position before kick');
                this.playKickAnimation();
                break;
            case 'KeyL':
                this.toggleLighting();
                break;
            case 'KeyR':
                console.log('R key pressed - resetting ball');
                this.goalScored = false;
                this.resetBall();
                break;
            case 'KeyT':
                console.log('Test reset - calling resetBall directly');
                this.resetBall();
                break;
            case 'KeyC':
                console.log('C key pressed - toggling collision sphere');
                this.toggleCollisionSphere();
                break;
            case 'KeyB':
                console.log('B key pressed - debugging ball bounds');
                this.debugBallBounds();
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
        // Reduced movement logging
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
            // First check if ball exists
            if (!this.ball) {
                console.log('❌ KICK BLOCKED: No ball found!');
                return;
            }
            
            // Check if ball has already been kicked
            if (this.ballKicked) {
                console.log('❌ KICK BLOCKED: Ball has already been kicked!');
                return;
            }
            
            // Check if ball is in its initial reset position before allowing kick
            // Use model position for X/Z (should match expected), and check ball center Y (accounts for geometry offset)
            const box = new THREE.Box3().setFromObject(this.ball);
            const ballCenter = box.getCenter(new THREE.Vector3());
            
            // Expected model position (what we set in resetBall)
            const expectedModelX = -3.9;
            const expectedModelZ = -56.25;
            
            // Check model position X and Z (these should match exactly after reset)
            const xDiff = Math.abs(this.ball.position.x - expectedModelX);
            const zDiff = Math.abs(this.ball.position.z - expectedModelZ);
            
            // For Y, check if ball center is at least BALL_RADIUS above ground (accounts for any Y adjustment)
            const minBallCenterY = this.GROUND_LEVEL + this.BALL_RADIUS;
            const yDiff = ballCenter.y < minBallCenterY ? (minBallCenterY - ballCenter.y) : 0;
            
            const tolerance = 0.5; // Tolerance for position checking
            
            console.log('=== KICK POSITION CHECK ===');
            console.log('Current ball model position:', this.ball.position);
            console.log('Current ball center position:', ballCenter);
            console.log('Expected model position (X, Z):', expectedModelX, expectedModelZ);
            console.log('Min ball center Y:', minBallCenterY.toFixed(2));
            console.log('Differences - X:', xDiff.toFixed(2), 'Y center below min:', yDiff.toFixed(2), 'Z:', zDiff.toFixed(2));
            console.log('Tolerance:', tolerance);
            
            if (xDiff > tolerance || yDiff > tolerance || zDiff > tolerance) {
                console.log('❌ KICK BLOCKED: Ball is not in reset position!');
                console.log('Ball must be within', tolerance, 'units of expected reset position to kick');
                console.log('HINT: Check if ball was properly reset. X diff:', xDiff.toFixed(2), 'Y diff:', yDiff.toFixed(2), 'Z diff:', zDiff.toFixed(2));
                return; // Don't play kick animation if ball is not reset
            }
            
            console.log('✅ Ball is in reset position, proceeding with kick animation');
            
            // Stop current animation
            if (this.currentAnimation) {
                this.currentAnimation.stop();
            }
            
            // Play kick animation (no loop, plays once)
            this.currentAnimation = this.mixer.clipAction(this.kickAnimation);
            this.currentAnimation.reset();
            this.currentAnimation.setLoop(THREE.LoopOnce);
            this.currentAnimation.play();
        // Reduced animation logging
            
            // Calculate target once and store it for both goalie animation and ball kick
            // Only left or right targets - no center shots
            const targetOptions = [
                { x: 11, name: 'middle right' },
                { x: -11, name: 'middle left' }
            ];
            const selectedTarget = targetOptions[Math.floor(Math.random() * targetOptions.length)];
            const collisionBoxCenterZ = -111;
            const collisionBoxCenterY = 5;
            const randomX = selectedTarget.x + (Math.random() - 0.5) * 1;
            const randomY = collisionBoxCenterY + (Math.random() - 0.5) * 0.5;
            const randomZ = collisionBoxCenterZ + (Math.random() - 0.5) * 0.5;
            const targetPosition = new THREE.Vector3(randomX, randomY, randomZ);
            const direction = new THREE.Vector3();
            direction.subVectors(targetPosition, this.ball.position);
            direction.normalize();
            
            // Store the direction for use in kickBall()
            this.ballDirection = direction;
            
            // Trigger goalie save animation ONLY if quiz answer is wrong
            setTimeout(() => {
                if (this.quizActive && this.quizAnswered && !this.quizCorrect) {
                    console.log('❌ Wrong answer! Goalie will save the ball!');
                this.playGoalieSaveAnimation(direction);
                } else if (this.quizActive && this.quizAnswered && this.quizCorrect) {
                    console.log('✅ Correct answer! Goalie will move away from the ball!');
                    // Move goalie in opposite direction of ball for correct answers
                    this.playGoalieMoveAwayAnimation(direction);
                } else {
                    // Default behavior for non-quiz mode
                    this.playGoalieSaveAnimation(direction);
                }
            }, 450); // 0.3 seconds before ball moves (750ms - 300ms = 450ms)
            
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
        
        // Update goalie animation mixer
        if (this.goalieMixer) {
            this.goalieMixer.update(deltaTime);
        }
        
        // Animate grass swaying
        this.animateGrass();
        
        // Add ball spinning animation when kicked
        if (this.ball && this.ballKicked && !this.goalScored) {
            // Calculate spin based on velocity direction
            const spinSpeed = this.ballVelocity.length() * 0.3;
            
            // Rotate around X and Z axes based on movement direction
            this.ball.rotation.x += this.ballVelocity.z * spinSpeed * 0.03;
            this.ball.rotation.z -= this.ballVelocity.x * spinSpeed * 0.03;
            
            // Add some Y-axis rotation for realistic spinning
            this.ball.rotation.y += spinSpeed * 0.05;
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
    
    // Quiz system methods
    startQuiz() {
        this.quizActive = true;
        this.currentQuestionIndex = 0;
        this.quizScore = 0;
        this.quizAnswered = false;
        this.quizCorrect = false;
        
        this.updateQuizUI();
        console.log('Quiz started!');
    }
    
    updateQuizUI() {
        const questionText = document.getElementById('questionText');
        const answerButtons = document.getElementById('answerButtons');
        const startQuizButton = document.getElementById('startQuiz');
        
        if (!this.quizActive) {
            questionText.textContent = 'Click "Start Quiz" to begin!';
            answerButtons.innerHTML = '';
            startQuizButton.style.display = 'block';
            return;
        }
        
        const currentQuestion = this.quizQuestions[this.currentQuestionIndex];
        questionText.textContent = `${currentQuestion.question}\n\nClick an answer to kick the ball!`;
        
        // Clear previous buttons
        answerButtons.innerHTML = '';
        
        // Create answer buttons
        currentQuestion.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.textContent = answer;
            button.style.cssText = 'display: block; width: 100%; margin: 5px 0; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer;';
            button.addEventListener('click', () => this.answerQuestion(index));
            answerButtons.appendChild(button);
        });
        
        // Update the top-right counter
        const currentQuestionCounter = document.getElementById('currentQuestion');
        const totalQuestionsCounter = document.getElementById('totalQuestionsCounter');
        if (currentQuestionCounter) {
            currentQuestionCounter.textContent = this.currentQuestionIndex + 1;
        }
        if (totalQuestionsCounter) {
            totalQuestionsCounter.textContent = this.quizQuestions.length;
        }
        
        // Update the top-left score display
        const topScoreElement = document.getElementById('topScore');
        if (topScoreElement) {
            topScoreElement.textContent = this.quizScore;
        }
        
        startQuizButton.style.display = 'none';
    }
    
    answerQuestion(answerIndex) {
        if (this.quizAnswered) return;
        
        this.quizAnswered = true;
        const currentQuestion = this.quizQuestions[this.currentQuestionIndex];
        this.quizCorrect = (answerIndex === currentQuestion.correct);
        
        if (this.quizCorrect) {
            this.quizScore++;
            console.log('✅ CORRECT ANSWER! Score:', this.quizScore);
            console.log('Quiz state - Active:', this.quizActive, 'Answered:', this.quizAnswered, 'Correct:', this.quizCorrect);
        } else {
            console.log('❌ WRONG ANSWER! Correct was:', currentQuestion.correct);
            console.log('Quiz state - Active:', this.quizActive, 'Answered:', this.quizAnswered, 'Correct:', this.quizCorrect);
        }
        
        // Update button colors
        const buttons = document.querySelectorAll('#answerButtons button');
        buttons.forEach((button, index) => {
            if (index === currentQuestion.correct) {
                button.style.background = '#4CAF50'; // Green for correct
            } else if (index === answerIndex && !this.quizCorrect) {
                button.style.background = '#F44336'; // Red for wrong
            }
            button.disabled = true;
        });
        
        // Immediately trigger kick sequence after answering
        console.log('🎯 Answer selected! Triggering kick sequence...');
        this.triggerKickSequence();
        
        // Move to next question after kick sequence completes
        setTimeout(() => {
            this.nextQuestion();
        }, 4000); // Longer delay to allow kick sequence to complete
    }
    
    nextQuestion() {
        this.currentQuestionIndex++;
        
        console.log('=== NEXT QUESTION ===');
        console.log('Current question index:', this.currentQuestionIndex);
        console.log('Quiz active:', this.quizActive);
        console.log('Ball position before next question:', this.ball ? this.ball.position.y.toFixed(2) : 'No ball');
        
        if (this.currentQuestionIndex >= this.quizQuestions.length) {
            this.endQuiz();
        } else {
            this.quizAnswered = false;
            this.quizCorrect = false;
            this.updateQuizUI();
            console.log('🎯 Ready for next question! Click an answer to trigger kick sequence.');
        }
    }
    
    endQuiz() {
        console.log('=== END QUIZ ===');
        console.log('Quiz active before end:', this.quizActive);
        console.log('Ball position before end quiz:', this.ball ? this.ball.position.y.toFixed(2) : 'No ball');
        
        this.quizActive = false;
        const questionText = document.getElementById('questionText');
        const answerButtons = document.getElementById('answerButtons');
        const startQuizButton = document.getElementById('startQuiz');
        
        questionText.textContent = `Quiz Complete! Final Score: ${this.quizScore}/${this.quizQuestions.length}`;
        answerButtons.innerHTML = '';
        startQuizButton.textContent = 'Restart Quiz';
        startQuizButton.style.display = 'block';
        
        console.log('Quiz ended! Final score:', this.quizScore);
        console.log('Ball position after end quiz:', this.ball ? this.ball.position.y.toFixed(2) : 'No ball');
    }
    
    triggerKickSequence() {
        console.log('🎯 Starting kick sequence...');
        console.log('Quiz state at kick start - Active:', this.quizActive, 'Answered:', this.quizAnswered, 'Correct:', this.quizCorrect);
        console.log('Ball position at kick start:', this.ball ? this.ball.position.y.toFixed(2) : 'No ball');
        
        // Reset ball to starting position first
        this.resetBall();
        
        console.log('Ball position after reset:', this.ball ? this.ball.position.y.toFixed(2) : 'No ball');
        
        // Wait a moment for ball to reset, then start kick animation
        setTimeout(() => {
            console.log('🎯 Starting kick animation...');
            console.log('Quiz state before kick animation - Active:', this.quizActive, 'Answered:', this.quizAnswered, 'Correct:', this.quizCorrect);
            console.log('Ball position before kick animation:', this.ball ? this.ball.position.y.toFixed(2) : 'No ball');
            this.playKickAnimation();
        }, 500);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new GLBGame();
        
        // Load the stadium first (contains the field)
        game.loadStadium();
        
        // Load your character GLB model with all animations
        game.loadGLBModel('character/ch_animations.glb');
        
        // Load the goal post
        game.loadGoalPost();
        
        // Load the ball
        game.loadBall();
        
        // Load the goalie
        game.loadGoalie();
        
        // Load the kick sound
        console.log('About to call loadKickSound()...');
        game.loadKickSound();
        console.log('loadKickSound() called');
        
        // Load the background music
        console.log('About to call loadBackgroundMusic()...');
        game.loadBackgroundMusic();
        console.log('loadBackgroundMusic() called');
        
        // Load the crowd cheering sound
        console.log('About to call loadCrowdCheering()...');
        game.loadCrowdCheering();
        console.log('loadCrowdCheering() called');
        
        // Load the crowd missed sound (for goalie saves)
        console.log('About to call loadCrowdMissed()...');
        game.loadCrowdMissed();
        console.log('loadCrowdMissed() called');
        
        // Make game globally accessible for debugging
        window.game = game;
        
        // Add music controls
        const playMusicButton = document.getElementById('playMusic');
        if (playMusicButton) {
            playMusicButton.addEventListener('click', () => {
                console.log('Play music button clicked');
                game.playBackgroundMusic();
            });
        }
        
        const stopMusicButton = document.getElementById('stopMusic');
        if (stopMusicButton) {
            stopMusicButton.addEventListener('click', () => {
                console.log('Stop music button clicked');
                game.stopBackgroundMusic();
            });
        }
        
        // Add quiz functionality
        const startQuizButton = document.getElementById('startQuiz');
        if (startQuizButton) {
            startQuizButton.addEventListener('click', () => {
                console.log('Start quiz button clicked');
                game.startQuiz();
            });
        }
        
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
