export const CONFIG = {
    // Map Boundaries (Repeating World)
    // Anything outside this range wraps to the opposite side.
    map: {
        size: 200,               // The world is -100 to +100 on X and Z
    },

    // Environment
    starCount: 8000,             // Number of background star particles

    // Spaceship
    ship: {
        scale: 0.5,              // Model scale factor
        maxSpeed: 15,            // Maximum velocity magnitude
        acceleration: 0.8,       // How quickly the ship speeds up per key press
        friction: 0.92,          // Velocity multiplier per frame (lower = more drag)
        tiltFactor: 0.8,         // How much the ship banks into turns
        turnSpeed: 0.15,         // How fast the ship rotates to face its heading
        boostMin: 10,            // Minimum teleport distance when boosting
        boostMax: 30,            // Maximum teleport distance when boosting
        boostCooldown: 1.0,      // Seconds between boosts
        bobbingSpeed: 1.0,       // Speed of the idle hovering sine wave
        bobbingHeight: 0.4,      // Height of the idle hovering sine wave
    },

    // Camera
    camera: {
        initialZoom: 80,         // Starting camera height
        minZoom: 30,             // Closest scroll-in
        maxZoom: 150,            // Farthest scroll-out
        zoomSpeed: 0.05,         // Mouse wheel sensitivity
        followLerp: 0.05,        // How smoothly the camera follows the ship (0-1)
        zoomLerp: 0.1,           // How smoothly the zoom interpolates (0-1)
    },

    // Port Artwork Material
    portSettings: {
        roughness: 0.8,          // 1.0 = fully matte, 0.0 = glossy
        metalness: 0.1,          // 0.0 = non-metallic, 1.0 = reflective
        glowIntensity: 0.25,     // Emissive glow brightness of the artwork
    },

    // Portal Gravity (magnetic pull when approaching a portal)
    portalGravity: {
        range: 2.5,              // Multiplier of portal radius; ship gets pulled within this range
        strength: 0.08,          // How strong the pull is per frame
        minDistance: 1.0,        // Stop pulling when ship is this close (prevents overshoot)
    },

    // Portal Definitions
    // Add or remove entries here to create artwork portals.
    ports: [
        {
            id: 'portal_1',
            name: 'Project Alpha',
            position: { x: 40, z: -40 },
            scale: 15,
            imagePath: './assets/artwork/art1.png',
            title: 'The Genesis Station',
            description: 'The primary orbital hub for the Genesis Project. This station serves as the gateway to the outer rim.',
            logs: [
                {
                    img: './assets/artwork/art2.png',
                    caption: 'Early structural silhouette focusing on the central reactor core.'
                },
                {
                    img: './assets/artwork/art3.png',
                    caption: 'Refining the atmospheric lighting and outer docking rings.'
                }
            ]
        },
        {
            id: 'portal_2',
            name: 'Project Beta',
            position: { x: -50, z: 20 },
            scale: 15,
            imagePath: './assets/artwork/art2.png',
            title: 'Nebula Dredger',
            description: 'Concept art for a heavy industrial ship designed to harvest raw materials from active nebulas.',
            logs: []
        }
    ]
};
