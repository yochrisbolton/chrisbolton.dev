/**
 * This is pretty rad - I know, but I didn't 
 * actually make this. If you're checking this out 
 * and wanting to approach me because of this rad 
 * eye-goggling effect, you should reach out to
 * @kevinnewcombe on codepen:
 * https://codepen.io/kevinnewcombe/pen/QWjJxxR
 */

let vWorld,
  world,
  mass,
  timeStep = 1 / 40,
  camera,
  scene,
  renderer,
  textureSize = [700, 1200];

const imgDir = "https://i.imgur.com/KsKRh0n.png";

let eyes = [
  { x: -7, z: 6 },
  { x: 5, z: 6 }
];

const sizes = {
  cover: {
    x: 100,
    y: 1,
    z: 100 * (textureSize[1] / textureSize[0])
  },
  eye: {
    r: 6,
    h: 0.5
  },
  cornea: {
    r: 4,
    h: 0.2
  }
};

let groundMesh, groundBody, coverMesh, coverBody;
let eyeCoverMaterial;
const maxRotationAngle = 7.5;
let currentRotation = { x: 0, y: 0, z: 0 };

function initCannon() {
  world = new CANNON.World();
  let board = new CANNON.Body({ mass: 0 });
  world.gravity.set(0, 0, 10);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 20;

  /* ************************* */
  /*     physics materials     */
  /* ************************* */
  const slipperyMaterial = new CANNON.Material();
  slipperyMaterial.friction = 0;
  const groundMaterial = new CANNON.Material();
  groundMaterial.friction = 0.3;

  eyes.forEach((eye, index) => {
    torusShape = CANNON.Trimesh.createTorus(sizes.eye.r, sizes.eye.h, 4, 16);
    torusBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    torusBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      THREE.Math.degToRad(-90)
    );
    torusBody.position.set(eye.x, sizes.cornea.r, eye.z);
    torusBody.addShape(torusShape);
    eye.torusBody = torusBody;
    world.addBody(eye.torusBody);

    // add cornea
    corneaShape = new CANNON.Sphere(sizes.cornea.r);
    eye.corneaBody = new CANNON.Body({ mass: 5, material: slipperyMaterial });
    eye.corneaBody.position.set(eye.x, sizes.cornea.r, eye.z);
    eye.corneaBody.addShape(corneaShape);
    world.addBody(eye.corneaBody);
  });

  let coverPlane = new CANNON.Plane();
  coverBody = new CANNON.Body({ mass: 0, material: groundMaterial });
  coverBody.position.set(0, sizes.cornea.r, 0);
  coverBody.addShape(coverPlane);
  coverBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(1, 0, 0),
    THREE.Math.degToRad(90)
  );
  world.add(coverBody);

  // ground
  let cPlane = new CANNON.Plane();
  groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
  groundBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(1, 0, 0),
    THREE.Math.degToRad(-90)
  );
  groundBody.addShape(cPlane);
  world.add(groundBody);
}

function updatePhysics() {
  world.step(timeStep);
  eyes.forEach((eye, index) => {
    eye.torusBody.position.copy(
      eye.torusMesh.getWorldPosition(new THREE.Vector3())
    );
    eye.torusBody.quaternion.copy(
      eye.torusMesh.getWorldQuaternion(new THREE.Quaternion())
    );
    eye.corneaMesh.position.copy(eye.corneaBody.position);
    eye.corneaMesh.quaternion.copy(vWorld.quaternion);
  });

  coverBody.position.copy(coverMesh.getWorldPosition(new THREE.Vector3()));
  coverBody.quaternion.copy(
    eyes[0].torusMesh.getWorldQuaternion(new THREE.Quaternion()).inverse()
  );
  groundBody.quaternion.copy(
    eyes[0].torusMesh.getWorldQuaternion(new THREE.Quaternion())
  );
}

function init() {
  scene = new THREE.Scene();
  vWorld = new THREE.Object3D();
  scene.add(vWorld);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    200
  );
  camera.position.set(0, 140, 30);
  camera.lookAt(new THREE.Vector3(0, 0, 30));

  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setClearColor(0xffffff, 0);
  renderer.setPixelRatio(window.devicePixelRatio);

  screenWidth = 500;
  screenHeight = 500;
  aspectRatio = screenWidth / screenHeight;
  renderer.setSize(screenWidth, screenHeight);
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();

  document.querySelector('.center').appendChild(renderer.domElement);
  loadMaterials();
  addLights();
}

function loadMaterials() {
  torusMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true
  });
  corneaMaterial = new THREE.MeshPhongMaterial({
    color: 0x000000,
    shininess: 90
  });
  bgMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 100
  });

  coverMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide
  });
  planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

  /*
   *  Eye Cover
   */
  eyeCoverMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    refractionRatio: 0.95,
    transparent: true,
    opacity: 0.1
  });

  loader = new THREE.TextureLoader();
  loader.load(
    imgDir,
    function (texture) {
      loadGeometry(texture);
    },
    undefined,
    function (err) {
      console.error("An error happened.");
    }
  );
}

function addLights() {
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  scene.add(hemiLight);
}

function loadGeometry(groundTexture) {
  torusGeometry = new THREE.TorusGeometry(sizes.eye.r, sizes.eye.h, 4, 16);
  eyes.forEach((eye, index) => {
    eye.torusMesh = new THREE.Mesh(torusGeometry, torusMaterial);
    eye.torusMesh.rotation.set(THREE.Math.degToRad(-90), 0, 0);
    eye.torusMesh.visible = false;
    eye.torusMesh.position.x = eye.x;
    eye.torusMesh.position.y = sizes.cornea.r;
    eye.torusMesh.position.z = eye.z;
    vWorld.add(eye.torusMesh);

    // cornea
    corneaGeometry = new THREE.SphereGeometry(sizes.cornea.r, 32, 32);
    eye.corneaMesh = new THREE.Mesh(corneaGeometry, corneaMaterial);
    corneaGeometry.translate(0, -16, 0);
    eye.corneaMesh.scale.y = 0.2;
    eye.corneaMesh.castShadow = true;
    eye.corneaMesh.receiveShadow = true;
    eye.corneaMesh.position.x = eye.x;
    eye.corneaMesh.position.z = eye.z;
    scene.add(eye.corneaMesh);

    // the white circle for the eye
    bgCylinder = new THREE.CircleGeometry(sizes.eye.r * 1.05, 32);
    bgCircle = new THREE.Mesh(bgCylinder, bgMaterial);
    bgCircle.position.x = eye.x;
    bgCircle.position.y = 0.1;
    bgCircle.position.z = eye.z;
    bgCircle.rotation.set(THREE.Math.degToRad(-90), 0, 0);
    vWorld.add(bgCircle);

    eyeCoverGeometry = new THREE.SphereGeometry(
      sizes.eye.r - sizes.eye.h / 2,
      32,
      32
    );
    eyeCover = new THREE.Mesh(eyeCoverGeometry, eyeCoverMaterial);
    eyeCover.visible = true;
    eyeCover.position.x = eye.x;
    eyeCover.scale.y = 0.5;
    eyeCover.position.z = eye.z;
    vWorld.add(eyeCover);
  });

  groundTexture.repeat.set(1, 1);
  let groundMeshMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    map: groundTexture
  });

  groundGeometry = new THREE.PlaneGeometry(
    sizes.cover.x,
    sizes.cover.z,
    20,
    20
  );
  groundMesh = new THREE.Mesh(groundGeometry, groundMeshMat);
  groundMesh.rotation.set(THREE.Math.degToRad(-90), 0, 0);
  vWorld.add(groundMesh);

  coverGeometry = new THREE.PlaneGeometry(sizes.cover.x, sizes.cover.z, 20, 20);
  coverMesh = new THREE.Mesh(coverGeometry, coverMaterial);
  coverMesh.rotation.set(THREE.Math.degToRad(90), 0, 0);
  coverMesh.position.y = sizes.cornea.r * 2.15;
  coverMesh.visible = false;
  vWorld.add(coverMesh);

  animate();
}

/* ********************** */
/*     mouse controls     */
/* ********************** */
let tilt = (x, y) => {
  currentRotation = {
    x: THREE.Math.degToRad(y * maxRotationAngle),
    y: 0,
    z: THREE.Math.degToRad(x * maxRotationAngle)
  };
};

let convertMousePosition = (mousePos, windowSize) => {
  return ((mousePos - windowSize) / windowSize + 0.5) * 2;
};

let adjustTarget = (event) => {
  let e = event || window.event;
  let pageX, pageY;
  mouseX = window.Event
    ? e.pageX
    : event.clientX +
      (document.documentElement.scrollLeft
        ? document.documentElement.scrollLeft
        : document.body.scrollLeft);
  mouseY = window.Event
    ? e.pageY
    : event.clientY +
      (document.documentElement.scrollTop
        ? document.documentElement.scrollTop
        : document.body.scrollTop);

  tilt(
    convertMousePosition(mouseX, window.innerWidth) * -1,
    convertMousePosition(mouseY, window.innerHeight)
  );
};

window.addEventListener("mousemove", adjustTarget);
window.addEventListener("touchstart", adjustTarget);
window.addEventListener("touchmove", adjustTarget);

function animate() {
  vWorld.rotation.set(currentRotation.x, 0, currentRotation.z);
  requestAnimationFrame(animate);
  updatePhysics();
  renderer.render(scene, camera);
}

document.addEventListener("DOMContentLoaded", function() {
  initCannon();
  init(); // light this candle
});
