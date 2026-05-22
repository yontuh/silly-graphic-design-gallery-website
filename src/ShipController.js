import * as THREE from 'three';

export class ShipController {
    constructor(config, scene) {
        this.config = config;
        this.scene = scene;
        this.ship = null;
        this.velocity = new THREE.Vector3();
        this.keys = { up: false, down: false, left: false, right: false, space: false };

        this.lastBoostTime = 0;
        this.time = 0;
        this.isPaused = false;

        window.addEventListener('keydown', (e) => this.onKey(e, true));
        window.addEventListener('keyup', (e) => this.onKey(e, false));
    }

    setShip(mesh) {
        this.ship = mesh;
        this.ship.rotation.order = 'YXZ';

        this.frontLight = new THREE.PointLight(0xffffff, 2, 20);
        this.frontLight.position.set(0, 0.5, 5);
        this.ship.add(this.frontLight);
    }

    onKey(event, isDown) {
        const key = event.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') this.keys.up = isDown;
        if (key === 's' || key === 'arrowdown') this.keys.down = isDown;
        if (key === 'a' || key === 'arrowleft') this.keys.left = isDown;
        if (key === 'd' || key === 'arrowright') this.keys.right = isDown;
        if (key === ' ') this.keys.space = isDown;
    }

    pause() {
        this.isPaused = true;
        this.keys = { up: false, down: false, left: false, right: false, space: false };
        this.velocity.set(0, 0, 0);
    }

    resume() {
        this.isPaused = false;
    }

    update(delta) {
        if (this.isPaused || !this.ship) return null;
        this.time += delta;

        this.frontLight.intensity = Math.sin(this.time * 3) * 1.0 + 1.5;

        if (this.keys.space && this.time - this.lastBoostTime > this.config.ship.boostCooldown) {
            const boostDistance = THREE.MathUtils.randFloat(this.config.ship.boostMin, this.config.ship.boostMax);

            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.ship.rotation.y);
            this.ship.position.addScaledVector(forward, boostDistance);

            this.lastBoostTime = this.time;
        }

        if (this.keys.up) this.velocity.z -= this.config.ship.acceleration;
        if (this.keys.down) this.velocity.z += this.config.ship.acceleration;
        if (this.keys.left) this.velocity.x -= this.config.ship.acceleration;
        if (this.keys.right) this.velocity.x += this.config.ship.acceleration;

        this.velocity.multiplyScalar(this.config.ship.friction);
        this.velocity.clampLength(0, this.config.ship.maxSpeed);

        this.ship.position.addScaledVector(this.velocity, delta * 10);

        if (this.velocity.lengthSq() > 0.01) {
            const targetHeading = Math.atan2(this.velocity.x, this.velocity.z);
            let diff = targetHeading - this.ship.rotation.y;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));

            this.ship.rotation.y += diff * this.config.ship.turnSpeed;
            const targetRoll = -diff * this.config.ship.tiltFactor;
            this.ship.rotation.z = THREE.MathUtils.lerp(this.ship.rotation.z, targetRoll, 0.1);
        } else {
            this.ship.rotation.z = THREE.MathUtils.lerp(this.ship.rotation.z, 0, 0.1);
        }

        // --- IDLE BOBBING ---
        this.ship.position.y = Math.sin(this.time * this.config.ship.bobbingSpeed) * this.config.ship.bobbingHeight;

        let wrapDelta = new THREE.Vector3();
        const halfMap = this.config.map.size / 2;

        if (this.ship.position.x > halfMap) wrapDelta.x = -this.config.map.size;
        if (this.ship.position.x < -halfMap) wrapDelta.x = this.config.map.size;
        if (this.ship.position.z > halfMap) wrapDelta.z = -this.config.map.size;
        if (this.ship.position.z < -halfMap) wrapDelta.z = this.config.map.size;

        if (wrapDelta.lengthSq() > 0) {
            this.ship.position.add(wrapDelta);
            return wrapDelta;
        }

        return null;
    }
}
