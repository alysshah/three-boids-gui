import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Boid from "./Boid.js";

let camera, scene, renderer, controls;
let boidCount = 550;
let boxDepth = 400;
let boxHeight = 400;
let boxWidth = 400;
let flock = [];
let confinementMode = 1; // 0 = checkEdges(), 1 = wrap(), 2 = bound()
let col = 0x00ffff;
let geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
let edges = new THREE.EdgesGeometry(geometry);
let line = new THREE.LineSegments(
  edges,
  new THREE.LineBasicMaterial({ color: col })
);
let boxVisible = true;
let cohMult = 0.5;
let sepMult = 2.0;
let aliMult = 3.0;
let cohRange = 50;
let sepRange = 25;
let aliRange = 50;

// Set up new GUI
const gui = new GUI();
const boidsVars = gui.addFolder("Boids Algorithm Variables");
const sceneVars = gui.addFolder("Scene Variables");

// GUI vars
const settings = {
  boxWidth: 400,
  boxHeight: 400,
  boxDepth: 400,
  boxVisible: true,
  col: 0x00ffff,
  confinementMode: 1,
  cohMult: 0.5,
  sepMult: 2.0,
  aliMult: 3.0,
  cohRange: 50,
  sepRange: 25,
  aliRange: 50,
};

init();
animate();

// GUI functionalities
function initGUI() {
  sceneVars
    .add(settings, "boxWidth", 100, 700)
    .name("box width")
    .onChange((value) => {
      boxWidth = value;
      scene.remove(line);
      updateBox();
    });
  sceneVars
    .add(settings, "boxHeight", 100, 700)
    .name("box height")
    .onChange((value) => {
      boxHeight = value;
      scene.remove(line);
      updateBox();
    });
  sceneVars
    .add(settings, "boxDepth", 0, 700)
    .name("box depth")
    .onChange((value) => {
      boxDepth = value;
      scene.remove(line);
      updateBox();
    });
  sceneVars
    .add(settings, "boxVisible")
    .name("box visible")
    .onChange((value) => {
      boxVisible = value;
      if (boxVisible) {
        updateBox();
      } else {
        scene.remove(line);
      }
    });
  sceneVars
    .addColor(settings, "col", 0x0000ff)
    .name("color")
    .onChange((value) => {
      col = value;
      scene.remove(line);
      updateBox();
    });

  boidsVars
    .add(settings, "confinementMode", { checkEdges: 0, wrap: 1, bound: 2 })
    .name("confinement mode")
    .onChange((value) => {
      confinementMode = value;
    });
  boidsVars
    .add(settings, "cohMult", 0, 5.0)
    .name("cohesion coef")
    .onChange((value) => (cohMult = value));
  boidsVars
    .add(settings, "sepMult", 0, 5.0)
    .name("seperation coef")
    .onChange((value) => (sepMult = value));
  boidsVars
    .add(settings, "aliMult", 0, 5.0)
    .name("alignment coef")
    .onChange((value) => (aliMult = value));
  boidsVars
    .add(settings, "cohRange", 10, 70)
    .name("cohesion range")
    .onChange((value) => (cohRange = value));
  boidsVars
    .add(settings, "sepRange", 10, 70)
    .name("separation range")
    .onChange((value) => (sepRange = value));
  boidsVars
    .add(settings, "aliRange", 10, 70)
    .name("alignment range")
    .onChange((value) => (aliRange = value));
}

function init() {
  // Initilize GUI
  initGUI();

  // Create the scene
  scene = new THREE.Scene();

  // Create a camera
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.z = 800;

  // Create a renderer and add it to the DOM
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement);

  // Add a cube to represent the boundary
  scene.add(line);

  // const axesHelper = new THREE.AxesHelper(100);
  // scene.add(axesHelper);

  // Add boids to scene and to flock array
  for (let i = 0; i < boidCount; i++) {
    const x = Math.random() * boxWidth - boxWidth / 2;
    const y = Math.random() * boxHeight - boxHeight / 2;
    const z = Math.random() * boxDepth - boxDepth / 2;
    const boid = new Boid(
      x,
      y,
      z,
      boxWidth,
      boxHeight,
      boxDepth,
      confinementMode
    );
    scene.add(boid.getMesh());
    flock.push(boid);
  }

  // Handle window resize
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // Update each boid
  flock.forEach((boid) => {
    boid.update(
      flock,
      confinementMode,
      col,
      cohMult,
      cohRange,
      sepMult,
      sepRange,
      aliMult,
      aliRange
    );
    boid.setBoxSize(boxWidth, boxHeight, boxDepth);
  });
  renderer.render(scene, camera);
}

function updateBox() {
  geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  edges = new THREE.EdgesGeometry(geometry);
  line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: col })
  );
  scene.add(line);
}
