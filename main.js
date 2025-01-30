import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Import OrbitControls
import { VRButton } from 'three/addons/webxr/VRButton.js'; // Import VRButton

// Create a scene
const scene = new THREE.Scene();

// Set up a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 4); // Adjust camera position for better view

// Set up a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Attach the renderer's canvas to the DOM

// Enable VR
renderer.xr.enabled = true; // Enable WebXR for VR support
document.body.appendChild(VRButton.createButton(renderer)); // Add VRButton to the page

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
scene.add(ambientLight);

// Create a GLTFLoader instance ----------------------------
const loader = new GLTFLoader();

// URL to the GLB file
const filePath = './assets/skull_downloadable/scene.gltf';

// Set a model variable
let model;

// Variables for dragging object
let isDragging = false;
let selectedObject = null;
let offset = new THREE.Vector3();

// Create a small sphere for intersection visualization
const intersectionSphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
const intersectionSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color
const intersectionSphere = new THREE.Mesh(intersectionSphereGeometry, intersectionSphereMaterial);
scene.add(intersectionSphere); // Add the sphere to the scene
intersectionSphere.visible = false; // Initially hide the sphere

// Load the GLB model
loader.load(
    filePath,
    function (gltf) {
        // Add the loaded model to the scene
        model = gltf.scene;
        scene.add(model);
        console.log('GLB file loaded successfully!');
    },
    undefined,
    function (error) {
        // Handle loading errors
        console.error('An error occurred while loading the GLB file:', error);
    }
);

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // Enable smooth transitions
controls.dampingFactor = 0.25;  // Control the damping speed
controls.screenSpacePanning = false;  // Prevent panning vertically beyond the canvas

// Raycaster for detecting object under the cursor
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Event listeners for pointer interaction (mouse/touch)
window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mouseup', onMouseUp, false);

// Pointer events
function onMouseDown(event) {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster to check for intersections
    updateRaycaster();

    // Check for intersections with the model
    const intersects = getIntersections();
    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        isDragging = true;

        // Disable OrbitControls while dragging
        controls.enabled = false;

        // Calculate the offset between the object's position and the cursor
        offset.subVectors(selectedObject.position, intersects[0].point);
        console.log('Intersection detected:', intersects[0].point); // Debug
    }
}

function onMouseMove(event) {
    // Update mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster and check for intersections
    updateRaycaster();

    // Check for intersections
    const intersects = getIntersections();
    if (intersects.length > 0) {
        // Show the intersection point
        intersectionSphere.visible = true;
        intersectionSphere.position.copy(intersects[0].point); // Update the sphere's position to intersection point

        if (isDragging && selectedObject) {
            // Only update X and Z axes, keeping Y constant
            const newPosition = intersects[0].point.add(offset);

            // Move the object on the X and Z plane only
            selectedObject.position.x = newPosition.x; // X-axis movement
            selectedObject.position.z = newPosition.z; // Z-axis movement
        }
    } else {
        // Hide the intersection sphere if no intersection is found
        intersectionSphere.visible = false;
    }
}

function onMouseUp() {
    isDragging = false;
    selectedObject = null;

    // Re-enable OrbitControls after dragging
    controls.enabled = true;
}

function updateRaycaster() {
    // Set up ray origin and direction based on the camera and mouse
    raycaster.ray.origin.copy(camera.position);
    raycaster.ray.direction.set(mouse.x, mouse.y, 0.5).unproject(camera).sub(camera.position).normalize();
    console.log('Ray direction:', raycaster.ray.direction); // Debug
}

function getIntersections() {
    // Return intersections with the model
    return raycaster.intersectObject(model, true);
}

// Animation loop
function animate() {
    renderer.setAnimationLoop(animate); // Use WebXR's animation loop
    // Update OrbitControls (for camera movement)
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}
animate(); // Calling the animate function
