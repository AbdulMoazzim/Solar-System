import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


// // Create loading overlay
// const loadingText = document.querySelector('#loading-progress');
// const loadingBar = document.querySelector('.loading-bar');
// const infoText = document.querySelector('.info-text');
// const closeBtn1 = document.querySelector('.close-btn1');
// const main = document.querySelector('.main');
// const left = document.querySelector('#left');
// const right = document.querySelector('#right');
const names = document.querySelector('#namesBody');
const close = document.querySelector('#close');

// let count = 0;

// // Function to remove loading overlay
// async function removeLoadingOverlay() {
//     let interval = setInterval(() => {
//         count++;
//         loadingBar.style.width = `${count}%`;
//         loadingText.innerText = `${count}%`;
//         if (count === 100) {
//             main.style.display = 'none';
//             clearInterval(interval);
//         }
//     }, 30);
// }


// await removeLoadingOverlay();

// setTimeout(() => {
//     infoText.style.transform = 'translateY(0px)';
// }, 5000);

// closeBtn1.addEventListener('click', () => {
//     infoText.style.transform = 'translateY(-600px)';
// });

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

function loadAsteroids(scene, planets, glb) {
    const loader = new GLTFLoader();
        
        planets.forEach((planet, index) => {
    
            if (!planet.obj || !planet.obj.planet) {
                return;
            }
    
            // Skip Earth
            if (planet.obj === earth) {
                return;
            }
    
            const planetMesh = planet.obj.planet;
            if (!planetMesh || !planetMesh.geometry) {
                return;
            }
    
            const planetRadius = planetMesh.geometry.parameters.radius;
            const numAsteroids = Math.floor(Math.random() * 2) + 2; // 2 to 3 asteroids per planet
    
            for (let i = 0; i < numAsteroids; i++) {
                loader.load(
                    glb,
                    (gltf) => {
                        const asteroid = gltf.scene;
                        asteroid.scale.set(0.0009, 0.0009, 0.0009);
                        asteroid.isAsteroid = true;
                        
                        const pivot = new THREE.Object3D();
                        const orbitRadius = planetRadius * (3 + Math.random() * 2); // Between 3 and 5 times the planet radius
                        const angle = Math.random() * Math.PI * 2;
                        const height = (Math.random() - 0.5) * planetRadius * 2;
    
                        pivot.position.set(
                            Math.cos(angle) * orbitRadius,
                            height,
                            Math.sin(angle) * orbitRadius
                        );
                        
                        pivot.add(asteroid);
                        asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
                        planetMesh.add(pivot);
    
                        function rotateAsteroid() {
                            pivot.rotation.y += 0.002;
                            requestAnimationFrame(rotateAsteroid);
                        }
                        rotateAsteroid();
                    }
                );
            }
        });
    
    // Create asteroids for the scene
    const numSceneAsteroids = Math.floor(Math.random() * 2) + 10; // 10 to 11 asteroids in the scene
    for (let i = 0; i < numSceneAsteroids; i++) {
        loader.load(
            glb,
            (gltf) => {
                const asteroid = gltf.scene;
                asteroid.scale.set(0.05, 0.05, 0.05); // Smaller scale for scene asteroids
                asteroid.isAsteroid = true; // Add this line to mark it as an asteroid
                
                const pivot = new THREE.Object3D();
                const orbitRadius = 100 + Math.random() * 200; // Random orbit between 100 and 300
                const angle = Math.random() * Math.PI * 2;
                pivot.position.set(
                    Math.cos(angle) * orbitRadius,
                    (Math.random() - 0.5) * 100,
                    Math.sin(angle) * orbitRadius
                );
                
                pivot.add(asteroid);
                asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

                scene.add(pivot);

                function rotateAsteroid() {
                    pivot.rotation.y += 0.002;
                    requestAnimationFrame(rotateAsteroid);
                }
                rotateAsteroid();
            }
        );
    }
}

function loadSatellites(earth, glb) {
  
    const loader = new GLTFLoader();
    const numSatellites = 5; // Number of satellites to create

    // Try to find the correct Earth object
    let earthObject = earth;
    if (earth.obj) earthObject = earth.obj;
    if (earth.planet) earthObject = earth.planet;
    if (earth.obj && earth.obj.planet) earthObject = earth.obj.planet;

    // Rest of the function remains the same
    for (let i = 0; i < numSatellites; i++) {
        loader.load(
            glb,
            (gltf) => {
                const satellite = gltf.scene;
                satellite.scale.set(0.01, 0.01, 0.01); // Adjust scale as needed
                
                const pivot = new THREE.Object3D();
                const orbitRadius = earthObject.geometry.parameters.radius * 1.3; // Orbit just above Earth
                const angle = (i / numSatellites) * Math.PI * 2; // Distribute evenly around Earth
                const height = (Math.random() - 0.5) * orbitRadius * 0.2; // Vary height slightly

                pivot.position.set(
                    Math.cos(angle) * orbitRadius,
                    height,
                    Math.sin(angle) * orbitRadius
                );
                
                pivot.add(satellite);
                satellite.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

                earthObject.add(pivot);

                function rotateSatellite() {
                    pivot.rotation.y += 0.005; // Adjust speed as needed
                    requestAnimationFrame(rotateSatellite);
                }
                rotateSatellite();
            }
        );
    }
}

// Create planets
const mercury = createPlanet(0.4, 'mercury.jpg', 10);
mercury.planet.name = "mercury";
const venus = createPlanet(0.9, 'venus.jpg', 15);
venus.planet.name = "venus";
const earth = createPlanet(1, 'earth.jpg', 20);
earth.planet.name = "earth";
const mars = createPlanet(0.5, 'mars.jpg', 25);
mars.planet.name = "mars";
const jupiter = createPlanet(2.5, 'jupiter.jpg', 35);
jupiter.planet.name = "jupiter";
const saturn = createPlanet(2, 'saturn.jpg', 45, 'saturn_rings.jpg', 2.5, 4, 0xffa500); // Orange glow for Saturn
saturn.planet.name = "saturn";
const uranus = createPlanet(1.5, 'uranus.jpg', 55, 'uranus_rings.jpg', 2, 3, 0x00ffff); // Cyan glow for Uranus
uranus.planet.name = "uranus";
const neptune = createPlanet(1.4, 'neptune.jpg', 65);
neptune.planet.name = "neptune";


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
    { obj: mercury, rotationSpeed: 0.0002, orbitSpeed: 0.008 },
    { obj: venus, rotationSpeed: 0.0001, orbitSpeed: 0.003 },
    { obj: earth, rotationSpeed: 0.0002, orbitSpeed: 0.002 },
    { obj: mars, rotationSpeed: 0.00016, orbitSpeed: 0.0016 },
    { obj: jupiter, rotationSpeed: 0.00008, orbitSpeed: 0.0004 },
    { obj: saturn, rotationSpeed: 0.00076, orbitSpeed: 0.00018 },
    { obj: uranus, rotationSpeed: 0.00006, orbitSpeed: 0.00008, rotationAxis: 'x' },
    { obj: neptune, rotationSpeed: 0.00064, orbitSpeed: 0.00002 },
    { obj: moon, rotationSpeed: 0.0002, orbitSpeed: 0.01 }
];

loadAsteroids(scene, planets, 'img/asteroid1.glb');
loadAsteroids(scene, planets, 'img/asteroid2.glb');
loadSatellites(earth, 'img/satellite1.glb');
loadSatellites(earth, 'img/satellite2.glb');

let data = {
    "mercury":[`Mercury is the smallest planet in the solar system and the closest to the Sun. It has a diameter of about 4,880 kilometers. Because of its proximity to the Sun, it experiences extreme temperature variations, with daytime temperatures reaching 430°C and nighttime temperatures dropping to -180°C. Its surface is heavily cratered, similar to Earth’s Moon, due to the lack of atmosphere that could protect it from impacts.`,`Mercury orbits the Sun every 88 Earth days, making it the fastest orbiting planet. It has no moons, and its lack of an atmosphere contributes to its harsh, barren landscape. Due to its closeness to the Sun, it’s challenging to observe from Earth. However, spacecraft like MESSENGER have provided detailed information about its surface and composition.`],
"venus":
[`Venus, the second planet from the Sun, is similar in size and structure to Earth, with a diameter of about 12,104 kilometers. However, it is an extremely hostile environment, with surface temperatures reaching 465°C due to a thick atmosphere composed primarily of carbon dioxide. This atmosphere creates a runaway greenhouse effect, trapping heat and making Venus the hottest planet in the solar system.`,`Venus has a day longer than its year, as it takes 243 Earth days to rotate once on its axis but only 225 days to orbit the Sun. It rotates backward compared to most planets, with its clouds made of sulfuric acid. Venus has no moons and its surface is covered in volcanoes, mountains, and large plains.`],

"earth":
[`Earth is the third planet from the Sun and the only known planet to support life. It has a diameter of 12,742 kilometers and is covered by 71% water, which supports a wide range of ecosystems. Earth’s atmosphere, composed primarily of nitrogen and oxygen, creates a habitable environment by regulating temperature and providing breathable air for organisms.`,`Earth takes 365.25 days to orbit the Sun and has one moon that stabilizes its axial tilt and drives ocean tides. Earth’s magnetic field shields the planet from harmful solar radiation, while its dynamic surface consists of mountains, plains, forests, and oceans, making it a diverse and life-sustaining planet.`],

"mars":
[`Mars, known as the "Red Planet", is the fourth planet from the Sun and is half the size of Earth, with a diameter of 6,779 kilometers. Its red appearance is due to iron oxide on its surface. Mars has the largest volcano in the solar system, Olympus Mons, and a massive canyon system called Valles Marineris.`,`Mars has a thin atmosphere composed mostly of carbon dioxide, causing extreme cold, with temperatures averaging -60°C. The planet has polar ice caps, and evidence suggests that liquid water may have existed in the past. Mars has two small moons, Phobos and Deimos, and scientists are investigating whether life could have once existed there.`],

"jupiter":
[`Jupiter is the largest planet in the solar system, with a diameter of 139,820 kilometers. It is a gas giant, made mostly of hydrogen and helium, and lacks a solid surface. Jupiter’s Great Red Spot is a gigantic storm that has been ongoing for centuries. The planet’s atmosphere is composed of swirling clouds and storms, including colorful bands and jet streams.`,`
Jupiter has 79 known moons, the largest of which are the Galilean moons: Io, Europa, Ganymede, and Callisto. It has the strongest magnetic field in the solar system, and its immense gravity influences many objects, including asteroids and comets. Jupiter orbits the Sun every 12 Earth years.`],"saturn":[`Saturn, the sixth planet from the Sun, is known for its stunning ring system. It is the second-largest planet, with a diameter of 116,460 kilometers. Like Jupiter, Saturn is a gas giant composed mostly of hydrogen and helium. Its rings are made up of ice and rock particles, varying in size from tiny grains to large chunks.`,`
Saturn has at least 83 moons, with Titan being the largest, which has its own thick atmosphere. Saturn’s ring system is the most extensive in the solar system, divided into several parts. The planet takes about 29.5 Earth years to complete one orbit around the Sun, and its magnetic field is weaker than Jupiter’s.`], "uranus":[`Uranus is the seventh planet from the Sun and an ice giant, with a diameter of 50,724 kilometers. It is unique because it rotates on its side, likely due to a massive collision in the past. Uranus has faint rings and at least 27 moons, with Miranda and Titania being the largest.`,`
Its atmosphere consists of hydrogen, helium, and methane, giving it a pale blue color. Uranus experiences extreme seasons, with each lasting over 20 years. The planet takes 84 Earth years to orbit the Sun, and its average temperature is -224°C, making it one of the coldest planets in the solar system.`],

"neptune":
[`Neptune is the eighth and farthest planet from the Sun, with a diameter of 49,244 kilometers. Like Uranus, it is an ice giant, composed mainly of hydrogen, helium, and methane. The presence of methane gives Neptune its deep blue color. The planet is known for its powerful winds, with speeds reaching up to 2,100 km/h, and large dark storms.`,`
Neptune has 14 known moons, with Triton being the largest and most notable. Triton has a retrograde orbit, meaning it orbits Neptune in the opposite direction to the planet’s rotation. Neptune takes 165 Earth years to complete one orbit around the Sun, and it has a faint, complex ring system.`],

"moon":
[`The Moon is Earth’s only natural satellite, with a diameter of 3,474 kilometers. It is the fifth-largest moon in the solar system. The Moon orbits Earth at a distance of about 384,400 kilometers and completes one orbit every 27.3 days. Its gravitational pull causes tides on Earth. The surface of the Moon is covered in craters, mountains, and vast plains known as maria, which are ancient volcanic plains.`,`
The Moon has no atmosphere, so it experiences drastic temperature changes, from boiling hot during the day to freezing cold at night. Its far side is often called the "dark side", though it receives sunlight just like the near side. The Moon is key in stabilizing Earth’s axial tilt, which regulates the planet’s climate over time.`],

"sun":
[`The Sun is a massive star at the center of our solar system, with a diameter of about 1.39 million kilometers. It is primarily composed of hydrogen and helium, and its energy is produced through nuclear fusion in its core. This process releases heat and light, which are essential for life on Earth. The Sun’s surface temperature is around 5,500°C, while its core reaches 15 million°C.`,`
The Sun’s gravity holds the planets, moons, and other solar system objects in orbit. It has an 11-year solar cycle, marked by sunspots, solar flares, and coronal mass ejections. The Sun will continue to shine for about 5 billion more years before evolving into a red giant and eventually a white dwarf.`]


}

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
    left.style.display = 'none';
    right.style.display = 'none';
    names.innerHTML = "Solar System";
}

// Event listener for the Escape key
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        close.style.display = "none";
        resetCamera();
    }
});
close.addEventListener('click',()=>{
    resetCamera();
    close.style.display = "none";
})

const setCameraWithCelestialBody = (body,data) => {
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
    } else if (body && body.obj && body.obj.planet) {
        bodyRadius = body.obj.planet.geometry.parameters.radius;
        bodyObject = body.obj.planet;
    
        orbitObject = body.obj.orbit;
    } else {
        return;
    }
  
    const cameraDistance = bodyRadius * (isSun ? 10 : (isMoon ? 7 : 10));
  
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
  
    
        // ... (rest of the function remains the same)
        left.style.display = 'block';
        right.style.display = 'block';
        let bodyData;
        let bodyName;
    
        if (isSun) {
            bodyName = 'sun';
        } else if (isMoon) {
            bodyName = 'moon';
        } else if (body && body.obj && body.obj.planet) {
            // Assuming the planet name is stored in a 'name' property of the planet object
            bodyName = body.obj.planet.name.toLowerCase();
        } 
        bodyData = data[bodyName];
        names.innerHTML = bodyName.toUpperCase();
    
        // Check if bodyData exists and is an array with at least 2 elements
        if (bodyData && Array.isArray(bodyData) && bodyData.length >= 2) {
            left.innerText = bodyData[0];
            right.innerText = bodyData[1];
        } 
    
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
          setCameraWithCelestialBody(sun,data);
      } else if (clickedObject === moon) {
          setCameraWithCelestialBody(moon,data);
      } else {
          const planet = planets.find(p => p.obj.planet === clickedObject || p.obj === clickedObject);
          if (planet) {
              setCameraWithCelestialBody(planet,data);
          }
      }
  }
  close.style.display = "block";
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
