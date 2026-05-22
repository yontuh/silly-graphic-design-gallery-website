import * as THREE from 'three';

export class PortManager {
    constructor(scene, shipController, config, renderer, visitedPortals) {
        this.scene = scene;
        this.shipController = shipController;
        this.config = config;
        this.renderer = renderer;
        this.visitedPortals = visitedPortals;
        this.ports = [];
        this.spawnCooldown = {};
        this.isTransitioning = false;

        this.textureLoader = new THREE.TextureLoader();

        this.config.ports.forEach(portData => {
            this.createPort(portData);
        });
    }

    createPort(portData) {
        this.textureLoader.load(portData.imagePath, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            if (this.renderer) texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

            const aspect = texture.image.width / texture.image.height;
            const height = portData.scale;
            const width = height * aspect;

            const artMat = new THREE.MeshStandardMaterial({
                map: texture, emissive: 0xffffff, emissiveMap: texture,
                emissiveIntensity: this.config.portSettings.glowIntensity,
                transparent: true, side: THREE.DoubleSide,
                roughness: this.config.portSettings.roughness, metalness: this.config.portSettings.metalness
            });

            const artGeo = new THREE.PlaneGeometry(width, height);

            const mapSize = this.config.map.size;

            const isVisited = this.visitedPortals.has(portData.id);
            const glowMat = new THREE.MeshStandardMaterial({
                color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2.0,
                transparent: true, opacity: isVisited ? 0.8 : 0.0
            });

            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const portGroup = new THREE.Group();

                    const artMesh = new THREE.Mesh(artGeo, artMat);
                    artMesh.rotation.x = -Math.PI / 2;

                    portGroup.add(artMesh);

                    portGroup.position.set(
                        portData.position.x + (i * mapSize),
                        -2,
                        portData.position.z + (j * mapSize)
                    );

                    this.scene.add(portGroup);

                    if (i === 0 && j === 0) {
                        const collisionRadius = Math.max(width, height) / 2;
                        this.ports.push({ mesh: portGroup, data: portData, radius: collisionRadius, glowMat: glowMat });
                    }
                }
            }
        });
    }

    recordSpawn(position) {
        for (let port of this.ports) {
            if (position.distanceTo(port.mesh.position) < port.radius) {
                this.spawnCooldown[port.data.id] = true;
            }
        }
    }

    update() {
        if (this.isTransitioning || !this.shipController.ship) return;
        const shipPos = this.shipController.ship.position;

        for (let port of this.ports) {
            if (this.spawnCooldown[port.data.id]) {
                if (shipPos.distanceTo(port.mesh.position) > port.radius) {
                    this.spawnCooldown[port.data.id] = false;
                }
                continue;
            }

            const distance = shipPos.distanceTo(port.mesh.position);

            // --- PORTAL GRAVITY (Magnetic Docking) ---
            const grav = this.config.portalGravity;
            if (distance < port.radius * grav.range && distance > grav.minDistance) {
                const pullDirection = new THREE.Vector3().subVectors(port.mesh.position, shipPos).normalize();
                this.shipController.velocity.add(pullDirection.multiplyScalar(grav.strength));
            }

            // --- COLLISION ---
            if (distance < port.radius) {
                this.triggerTransition(port);
            }
        }
    }

    clearVisited() {
        for (let port of this.ports) {
            port.glowMat.opacity = 0.0;
        }
    }

    triggerTransition(port) {
        this.isTransitioning = true;
        this.shipController.pause();

        const scrollArea = document.getElementById('ui-scroll-area');
        scrollArea.innerHTML = '';
        scrollArea.scrollTop = 0;

        const heroHTML = `
            <div class="hero-entry">
                <img src="${port.data.imagePath}" alt="Hero Image">
                <h2>${port.data.title}</h2>
                <p>${port.data.description}</p>
            </div>
        `;
        scrollArea.innerHTML += heroHTML;

        if (port.data.logs && port.data.logs.length > 0) {
            port.data.logs.forEach((log, index) => {
                const logHTML = `
                    <div class="log-entry">
                        <div class="log-image">
                            <img src="${log.img}" alt="Process ${index}">
                        </div>
                        <div class="log-text">
                            <h3>LOG_ENTRY_0${index + 1}</h3>
                            <p>${log.caption}</p>
                        </div>
                    </div>
                `;
                scrollArea.innerHTML += logHTML;
            });
        }

        document.getElementById('mainframe-ui').classList.remove('hidden');

        if (!this.visitedPortals.has(port.data.id)) {
            this.visitedPortals.add(port.data.id);
            port.glowMat.opacity = 0.8;

            let visitedList = JSON.parse(localStorage.getItem('visitedPortals')) || [];
            visitedList.push(port.data.id);
            localStorage.setItem('visitedPortals', JSON.stringify(visitedList));
        }

        const pushBackDir = new THREE.Vector3().subVectors(this.shipController.ship.position, port.mesh.position).normalize();
        this.shipController.ship.position.addScaledVector(pushBackDir, port.radius + 2);
    }
}
