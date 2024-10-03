import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

// Create loading overlay
const loadingOverlay = document.querySelector('#loading-overlay');
const loadingText = document.querySelector('#loading-progress');
const loadingBar = document.querySelector('.loading-bar');
const infoText = document.querySelector('.info-text');
const closeBtn = document.querySelector('.close-btn');
const main = document.querySelector('.main');
let count = 0;

// Function to remove loading overlay
async function removeLoadingOverlay() {
    let interval = setInterval(() => {
        count++;
        loadingBar.style.width = `${count}%`;
        loadingText.innerText = `${count}%`;
        if (count === 100) {
            loadingOverlay.style.display = 'none';
            infoText.style.display = 'block';
            clearInterval(interval);
        }
    }, 30);
}


await removeLoadingOverlay();

closeBtn.addEventListener('click', () => {
    main.style.display = 'none';
});

// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

// Create sun
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('img/sun.jpg') });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Create background
const backgroundTexture = new THREE.TextureLoader().load('img/stars.jpg');
const backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.BackSide });
const backgroundGeometry = new THREE.SphereGeometry(500, 32, 32);
const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
scene.add(background);

const glowVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 glowColor;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
    gl_FragColor = vec4(glowColor, 1.0) * intensity * 0.5;
  }
`;

// Function to create planets and their rings
function createPlanet(radius, texture, position, ringTexture = null, ringInnerRadius = 0, ringOuterRadius = 0, ringColor = 0xffffff) {
    const planetGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const planetMaterial = new THREE.MeshBasicMaterial({ 
      map: new THREE.TextureLoader().load(`img/${texture}`),
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    
    const orbitRadius = position;
    const orbitObject = new THREE.Object3D();
    orbitObject.add(planet);
    planet.position.x = orbitRadius;
  
    if (ringTexture) {
      const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64);
      const ringMaterial = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load(`img/${ringTexture}`),
        side: THREE.DoubleSide,
        transparent: true,
        emissive: new THREE.Color(ringColor),
        emissiveIntensity: 0.5
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      planet.add(ring);

      // Add glow effect
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(ringColor) }
        },
        vertexShader: glowVertexShader,
        fragmentShader: glowFragmentShader,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
      });

      const glowGeometry = new THREE.RingGeometry(ringInnerRadius * 1.1, ringOuterRadius * 1.1, 64);
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.rotation.x = Math.PI / 2;
      planet.add(glowMesh);
    }
  
    sun.add(orbitObject);
    return { planet, orbit: orbitObject };
}

// Create planets
const mercury = createPlanet(0.4, 'mercury.jpg', 10);
const venus = createPlanet(0.9, 'venus.jpg', 15);
const earth = createPlanet(1, 'earth.jpg', 20);
const mars = createPlanet(0.5, 'mars.jpg', 25);
const jupiter = createPlanet(2.5, 'jupiter.jpg', 35);
const saturn = createPlanet(2, 'saturn.jpg', 45, 'saturn_rings.jpg', 2.5, 4, 0xffa500); // Orange glow for Saturn
const uranus = createPlanet(1.5, 'uranus.jpg', 55, 'uranus_rings.jpg', 2, 3, 0x00ffff); // Cyan glow for Uranus
const neptune = createPlanet(1.4, 'neptune.jpg', 65);

// Tilt Uranus
uranus.planet.rotation.z = Math.PI * 0.5;

// Adjust the ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Adjust the sun's light
const sunLight = new THREE.PointLight(0xffffff, 1.5, 300);
sun.add(sunLight);


// Create renderer
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create moon
const moonRadius = 0.27; // Moon's radius relative to Earth
const moonOrbitRadius = 2.5; // Moon's orbit radius relative to Earth
const moonTexture = new THREE.TextureLoader().load('img/moon.jpg');
const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
const moonMaterial = new THREE.MeshBasicMaterial({ map: moonTexture });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);

// Create moon's orbit
const moonOrbit = new THREE.Object3D();
earth.planet.add(moonOrbit);
moonOrbit.add(moon);

// Position moon in its orbit
moon.position.set(moonOrbitRadius, 0, 0);

// Modify the planets array
const planets = [
    { obj: mercury, rotationSpeed: 0.01, orbitSpeed: 0.04 },
    { obj: venus, rotationSpeed: 0.005, orbitSpeed: 0.015 },
    { obj: earth, rotationSpeed: 0.01, orbitSpeed: 0.01 },
    { obj: mars, rotationSpeed: 0.008, orbitSpeed: 0.008 },
    { obj: jupiter, rotationSpeed: 0.004, orbitSpeed: 0.002 },
    { obj: saturn, rotationSpeed: 0.038, orbitSpeed: 0.0009 },
    { obj: uranus, rotationSpeed: 0.003, orbitSpeed: 0.0004, rotationAxis: 'x' },
    { obj: neptune, rotationSpeed: 0.032, orbitSpeed: 0.0001 },
    { obj: moon, rotationSpeed: 0.01, orbitSpeed: 0.05 } // Add moon to the planets array
];

let isOrbiting = false;

// Function to reset camera and controls
function resetCamera() {
    isOrbiting = false;
    
    // Reset camera position
    camera.position.set(0, 10, 40); // Adjust these values as needed
    
    // Reset camera rotation
    camera.rotation.set(0, 0, 0);
    
    // Reset controls target
    controls.target.set(0, 0, 0);
    
    // Enable controls
    controls.enabled = true;
    
    // Update controls
    controls.update();
    
    console.log('Camera reset and controls enabled');
}

// Event listener for the Escape key
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        resetCamera();
    }
});
// Set up camera to move and rotate around the celestial body
const setCameraWithCelestialBody = (body) => {
  isOrbiting = true;
  controls.enabled = false;

  // Stop any ongoing animation loops
  if (window.cameraUpdateLoop) {
      cancelAnimationFrame(window.cameraUpdateLoop);
      window.cameraUpdateLoop = null;
  }
  // Determine the type of celestial body and set appropriate parameters
  let bodyRadius, bodyObject, orbitObject;
  const isSun = body === sun;
  const isMoon = body === moon;

  if (isSun) {
      bodyRadius = sun.geometry.parameters.radius;
      bodyObject = sun;
      orbitObject = sun;
  } else if (isMoon) {
      bodyRadius = moon.geometry.parameters.radius;
      bodyObject = moon;
      orbitObject = moonOrbit;
  } else {
      bodyRadius = body.obj.planet.geometry.parameters.radius;
      bodyObject = body.obj.planet;
      orbitObject = body.obj.orbit;
  }

  const cameraDistance = bodyRadius * (isSun ? 3 : 2); // Further for sun, closer for planets/moon

  // Initialize camera rotation angle
  let cameraRotationAngle = 0;

  // Function to update camera position
  const updateCamera = () => {
    if (!isOrbiting) return;

      // Get the body's world position
      const bodyWorldPosition = new THREE.Vector3();
      bodyObject.getWorldPosition(bodyWorldPosition);

      // Calculate camera position rotating around the body
      cameraRotationAngle += isSun ? 0.001 : 0.005; // Slower rotation for sun
      const cameraX = Math.sin(cameraRotationAngle) * cameraDistance;
      const cameraZ = Math.cos(cameraRotationAngle) * cameraDistance;
      const cameraY = bodyRadius * (isSun ? 0.3 : 0.5); // Lower for sun, higher for planets/moon

      const cameraPosition = new THREE.Vector3(
          bodyWorldPosition.x + cameraX,
          bodyWorldPosition.y + cameraY,
          bodyWorldPosition.z + cameraZ
      );

      // Set camera position and look at the body
      camera.position.copy(cameraPosition);
      camera.lookAt(bodyWorldPosition);

      // Update the body's position if it's orbiting
      if (!isSun) {
          orbitObject.rotation.y += isMoon ? 0.02 : 0.005; // Faster orbit for moon
      }

      // Render the scene
      renderer.render(scene, camera);

      // Request next frame
      requestAnimationFrame(updateCamera);
  };

  // Start updating the camera
  updateCamera();
};


// Create a raycaster and mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to handle click events
function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (clickedObject === sun) {
          setCameraWithCelestialBody(sun);
      } else if (clickedObject === moon) {
          setCameraWithCelestialBody(moon);
      } else {
          const planet = planets.find(p => p.obj.planet === clickedObject || p.obj === clickedObject);
          if (planet) {
              setCameraWithCelestialBody(planet);
          }
      }
  }
}

// Add click event listener to the renderer's DOM element
renderer.domElement.addEventListener('click', onMouseClick, false);

function animate() {
    requestAnimationFrame(animate);

    sun.rotation.y += 0.004;

    planets.forEach(planet => {
        if (planet.obj === moon) {
            // Moon's rotation and orbit
            planet.obj.rotation.y += planet.rotationSpeed;
            moonOrbit.rotation.y += planet.orbitSpeed;
        } else if (planet.rotationAxis === 'x') {
            planet.obj.planet.rotation.x += planet.rotationSpeed;
            planet.obj.orbit.rotation.y += planet.orbitSpeed;
        } else {
            planet.obj.planet.rotation.y += planet.rotationSpeed;
            planet.obj.orbit.rotation.y += planet.orbitSpeed;
        }
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();

