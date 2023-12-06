//IMPORT MODULES
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';


//CONSTANT & VARIABLES
let width = window.innerWidth;
let height = window.innerHeight;

//GUI PAREMETERS
var gui;
const parameters = {
  resolution: 15,
  sides: 6,
  radius: 1.8,
  depth: 0.2,
  distance: 0.9,
  frequency: 0.6, 
  amplitude: 0.7, 
  phase: 1.6,
  hole: 0.2
}

//SCENE VARIABLES
var scene;
var camera;
var renderer;
var container;
var control;
var ambientLight;
var directionalLight;

//GEOMETRY PARAMETERS
//Create an empty array for storing all the extruded polygons
let sceneExtrudedPolygons = [];
let resolution = parameters.resolution;
let sides = parameters.sides;
let radius = parameters.radius;
let depth = parameters.depth;
let distance = parameters.distance;

function main(){
  //GUI
  gui = new GUI;  
  gui.add(parameters, 'resolution', 1, 30, 1);  
  gui.add(parameters, 'sides', 3, 12, 1);
  gui.add(parameters, 'radius', 1, 5, 0.1);
  gui.add(parameters, 'depth', 0.1, 2, 0.1);
  gui.add(parameters, 'distance', 0, 2, 0.1);
  gui.add(parameters, 'frequency', 0, 1, 0.1);
  gui.add(parameters, 'amplitude', 0, 2, 0.1);
  gui.add(parameters, 'phase', 0, 2 * Math.PI, 0.1);
  gui.add(parameters, 'hole', 0, 1, 0.1);

  //CREATE SCENE AND CAMERA
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 35, width / height, 0.1, 100);
  camera.position.set(30, 5, 20)

  //LIGHTINGS
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
  directionalLight.position.set(2,5,5);
  directionalLight.target.position.set(-1,-1,0);
  scene.add( directionalLight );
  scene.add(directionalLight.target);

  //GEOMETRY INITIATION
  //Call functions to create and rotate extruded polygons
  createExtrudedPolygons();
  rotateExtrudedPolygons();
  createPlane();

  //RESPONSIVE WINDOW
  window.addEventListener('resize', handleResize);
 
  //CREATE A RENDERER
  renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container = document.querySelector('#threejs-container');
  container.append(renderer.domElement);
  
  //CREATE MOUSE CONTROL
  control = new OrbitControls( camera, renderer.domElement );

  //EXECUTE THE UPDATE
  animate();
}
 
//-----------------------------------------------------------------------------------
//HELPER FUNCTIONS
//-----------------------------------------------------------------------------------
//GEOMETRY FUNCTIONS
//Create extruded polygons
function createExtrudedPolygons() {
  
  const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff });
  
  //Loop to create extruded polygons based on resolution
  for(let i=0; i<resolution; i++) {
    let sides = parameters.sides; 
    let distance = parameters.distance;
    let radius = parameters.amplitude * Math.sin(parameters.frequency * i + parameters.phase) + parameters.radius;
      
    const shape = new THREE.Shape();
    const hole = new THREE.Path();

    const angleStep = (2 * Math.PI) / sides;
      
    for (let j = 0; j < sides; j++) {
      const angle = j * angleStep;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (j === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }

      //Create hole by adding points in reverse order
      const holeX = (radius - parameters.hole) * Math.cos(angle);
      const holeY = (radius - parameters.hole) * Math.sin(angle);
      if (j === 0) {
        hole.moveTo(holeX, holeY);
      } else {
        hole.lineTo(holeX, holeY);
      }
    }

    //Close the paths
    shape.autoClose = true;
    hole.autoClose = true;

    shape.holes.push(hole);

    //Extrude polygon shape
    const extrudeSettings = { depth: parameters.depth, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  
    //Create mesh and position
    const mesh = new THREE.Mesh(geometry, material);

    //Apply initial rotation on polygon shape
    geometry.rotateY(Math.PI / 2); 
       
    mesh.position.set(i * (parameters.depth + distance), 0, 0); 
    mesh.name = "polygon " + i;
    sceneExtrudedPolygons.push(mesh);
  
    scene.add(mesh);
  }
}

//Rotate extruded polygons
function rotateExtrudedPolygons() {
  sceneExtrudedPolygons.forEach((element, index) => {
    let scene_extrudedPolygon = scene.getObjectByName(element.name);

    //Adjust parameters to create rotation
    const frequencyX = parameters.frequency; 
    const amplitudeX = parameters.amplitude; 
    const phaseX = parameters.phase; 

    const frequencyY = parameters.frequency * 2; 
    const amplitudeY = parameters.amplitude / 2; 
    const phaseY = parameters.phase; 

    //Implement rotation angles based on functions
    const radian_rotX = amplitudeX * Math.sin(frequencyX * index + phaseX);
    const radian_rotY = amplitudeY * Math.cos(frequencyY * index + phaseY);

    scene_extrudedPolygon.rotation.set(radian_rotX, radian_rotY, 0);
  });
}


//Create a plane in xz-direction
function createPlane() {
  const geometry = new THREE.PlaneGeometry(500, 500);
  const material = new THREE.MeshPhysicalMaterial({ color: 0x666666, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2; 
  mesh.position.y = 0;

  scene.add(mesh);
}


//REMOVE OBJECTS AND CLEAN CACHES
function removeObject(sceneObject) {
  if (!(sceneObject instanceof THREE.Object3D)) return;

  //REMOVE THE GEOMETRY TO FREE GPU RESOURCES
  if(sceneObject.geometry) sceneObject.geometry.dispose();

  //REMOVE THE MATERIAL TO FREE GPU RESOURCES
  if(sceneObject.material) {
    if(sceneObject.material instanceof Array) {
      sceneObject.material.forEach(material => material.dispose());
    }
    else {
      sceneObject.material.dispose();
    }
  }

  //REMOVE OBJECT FROM SCENE
  sceneObject.removeFromParent();
}

//REMOVE THE CUBES
function removeExtrudedPolygons() {
  resolution = parameters.resolution;
  
  sceneExtrudedPolygons.forEach(element => {
    let scene_extrudedPolygon = scene.getObjectByName(element.name);
    removeObject(scene_extrudedPolygon);
  })

  sceneExtrudedPolygons = [];
}

//RESPONSIVE
function handleResize() {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.render(scene, camera);
}

//Function to update polygons when sliders change
function updateExtrudedPolygons() {
  removeExtrudedPolygons();
  createExtrudedPolygons();
  rotateExtrudedPolygons();
}

//ANIMATE AND RENDER
function animate() {
	requestAnimationFrame( animate );
 
  control.update();

  if(resolution !== parameters.resolution || parameters.sides !== sceneExtrudedPolygons[0]?.geometry.parameters.shapes.length) {
    removeExtrudedPolygons();
    createExtrudedPolygons();
    rotateExtrudedPolygons();
  }

	renderer.render( scene, camera );
}
//-----------------------------------------------------------------------------------
// CLASS
//-----------------------------------------------------------------------------------


//-----------------------------------------------------------------------------------
// EXECUTE MAIN 
//-----------------------------------------------------------------------------------

main();
