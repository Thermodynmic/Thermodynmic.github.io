class SpaceScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#space-canvas'),
            antialias: true,
            alpha: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Add orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 100;
        this.controls.maxDistance = 500;
        
        this.init();
        this.animate();
        this.handleResize();
        this.setupKeyboardControls();
        
        // Hide loading screen after initialization
        document.getElementById('loading').style.display = 'none';
    }

    init() {
        // Create stars
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000;
            positions[i + 1] = (Math.random() - 0.5) * 2000;
            positions[i + 2] = (Math.random() - 0.5) * 2000;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0.8
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);

        // Create nebula effect
        const nebulaGeometry = new THREE.SphereGeometry(500, 32, 32);
        const nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorA: { value: new THREE.Color(0x1a237e) },
                colorB: { value: new THREE.Color(0x880e4f) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 colorA;
                uniform vec3 colorB;
                varying vec2 vUv;
                
                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = length(vUv - center);
                    
                    float noise = sin(dist * 10.0 + time) * 0.5 + 0.5;
                    vec3 color = mix(colorA, colorB, noise);
                    
                    float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
                    gl_FragColor = vec4(color, alpha * 0.3);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        this.scene.add(this.nebula);

        // Create Lego F1 Driver
        this.createF1Driver();

        // Position camera
        this.camera.position.set(200, 100, 200);
        this.camera.lookAt(0, 0, 0);
    }

    createF1Driver() {
        // Create a group to hold all parts of the F1 driver
        this.f1Driver = new THREE.Group();

        // Body (F1 car body)
        const bodyGeometry = new THREE.BoxGeometry(40, 15, 80);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 7.5;
        this.f1Driver.add(body);

        // Driver seat
        const seatGeometry = new THREE.BoxGeometry(20, 30, 20);
        const seatMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 25, 0);
        this.f1Driver.add(seat);

        // Driver head
        const headGeometry = new THREE.BoxGeometry(15, 15, 15);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 45, 0);
        this.f1Driver.add(head);

        // Helmet
        const helmetGeometry = new THREE.SphereGeometry(8, 16, 16);
        const helmetMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.set(0, 52, 0);
        this.f1Driver.add(helmet);

        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(5, 5, 10, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const wheelPositions = [
            { x: -25, y: 5, z: 30 },
            { x: 25, y: 5, z: 30 },
            { x: -25, y: 5, z: -30 },
            { x: 25, y: 5, z: -30 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos.x, pos.y, pos.z);
            this.f1Driver.add(wheel);
        });

        // Add lights for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 100);
        this.scene.add(directionalLight);

        // Position the F1 driver
        this.f1Driver.position.set(0, 0, 0);
        this.scene.add(this.f1Driver);

        // Movement speed
        this.movementSpeed = 5;
        this.rotationSpeed = 0.02;
    }

    setupKeyboardControls() {
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    handleMovement() {
        if (this.keys['ArrowLeft']) {
            this.f1Driver.rotation.y += this.rotationSpeed;
        }
        if (this.keys['ArrowRight']) {
            this.f1Driver.rotation.y -= this.rotationSpeed;
        }
        if (this.keys['ArrowUp']) {
            this.f1Driver.position.x -= Math.sin(this.f1Driver.rotation.y) * this.movementSpeed;
            this.f1Driver.position.z -= Math.cos(this.f1Driver.rotation.y) * this.movementSpeed;
        }
        if (this.keys['ArrowDown']) {
            this.f1Driver.position.x += Math.sin(this.f1Driver.rotation.y) * this.movementSpeed;
            this.f1Driver.position.z += Math.cos(this.f1Driver.rotation.y) * this.movementSpeed;
        }
        if (this.keys['PageUp']) {
            this.f1Driver.position.y += this.movementSpeed;
        }
        if (this.keys['PageDown']) {
            this.f1Driver.position.y -= this.movementSpeed;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate stars
        this.stars.rotation.y += 0.0002;
        
        // Update nebula
        this.nebula.material.uniforms.time.value += 0.001;
        this.nebula.rotation.y += 0.0001;
        
        // Handle F1 driver movement
        this.handleMovement();
        
        // Update controls
        this.controls.update();
        
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
}

// Initialize the scene when the page loads
window.addEventListener('load', () => {
    const spaceScene = new SpaceScene();
}); 