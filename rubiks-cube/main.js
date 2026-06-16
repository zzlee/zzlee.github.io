// Three.js setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 5, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Rubik's Cube colors
// U: White, D: Yellow, F: Green, B: Blue, L: Orange, R: Red
// In Three.js materials array order for BoxGeometry: Right, Left, Top, Bottom, Front, Back
// 0: R, 1: L, 2: U, 3: D, 4: F, 5: B
const COLORS = {
  R: 0xb71234, // Red
  L: 0xff5800, // Orange
  U: 0xffffff, // White
  D: 0xffd500, // Yellow
  F: 0x009b48, // Green
  B: 0x0046ad, // Blue
  BLANK: 0x555555 // Gray for internal or blank faces
};

const FACE_ORDER = ['R', 'L', 'U', 'D', 'F', 'B'];

let cubelets = [];
const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

function createCubelets() {
  const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95); // Slightly smaller than 1 to show gaps

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const materials = [];

        // Material order: Right(+x), Left(-x), Top(+y), Bottom(-y), Front(+z), Back(-z)
        materials.push(new THREE.MeshPhongMaterial({ color: x === 1 ? COLORS.R : COLORS.BLANK }));
        materials.push(new THREE.MeshPhongMaterial({ color: x === -1 ? COLORS.L : COLORS.BLANK }));
        materials.push(new THREE.MeshPhongMaterial({ color: y === 1 ? COLORS.U : COLORS.BLANK }));
        materials.push(new THREE.MeshPhongMaterial({ color: y === -1 ? COLORS.D : COLORS.BLANK }));
        materials.push(new THREE.MeshPhongMaterial({ color: z === 1 ? COLORS.F : COLORS.BLANK }));
        materials.push(new THREE.MeshPhongMaterial({ color: z === -1 ? COLORS.B : COLORS.BLANK }));

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.set(x, y, z);

        mesh.userData = {
          initialPosition: new THREE.Vector3(x, y, z),
          x: x, y: y, z: z
        };

        cubelets.push(mesh);
        cubeGroup.add(mesh);
      }
    }
  }
}

createCubelets();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
}

animate();

// Mouse interaction state
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let startIntersect = null;
let dragAxis = null;
let activeCubelets = [];
let rotationPivot = new THREE.Group();
scene.add(rotationPivot);

let isAnimating = false;

// Helpers for interaction
function getIntersect(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubelets);
  return intersects.length > 0 ? intersects[0] : null;
}


renderer.domElement.addEventListener('pointerdown', (event) => {
  if (isAnimating || event.button !== 0 || event.target.tagName !== 'CANVAS') return;

  if (event.ctrlKey) {
    // If Ctrl is pressed, let OrbitControls handle it (do nothing here)
    return;
  }

  const intersect = getIntersect(event);
  if (intersect) {
    if (isBlankMode) {
      handleClick(intersect);
      return;
    }
    controls.enabled = false;
    isDragging = true;
    startIntersect = intersect;
    event.stopPropagation();
  }
}, { capture: true });

let dragStartPoint = new THREE.Vector3();
let hoveredIntersect = null;

window.addEventListener('pointermove', (event) => {
  const currentIntersect = getIntersect(event);
  hoveredIntersect = currentIntersect;

  if (!isDragging || !startIntersect || isAnimating) return;
  if (!currentIntersect) return;

  if (!dragAxis) {
    const startPoint = startIntersect.point;
    const currentPoint = currentIntersect.point;
    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;
    const dz = currentPoint.z - startPoint.z;

    const normal = startIntersect.face.normal.clone().transformDirection(startIntersect.object.matrixWorld).round();

    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || Math.abs(dz) > 0.1) {
        let moveVec = new THREE.Vector3(dx, dy, dz);
        let moveAxis = 'x';
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > Math.abs(dz)) moveAxis = 'y';
        if (Math.abs(dz) > Math.abs(dx) && Math.abs(dz) > Math.abs(dy)) moveAxis = 'z';

        let normalAxis = 'x';
        if (Math.abs(normal.y) > 0.5) normalAxis = 'y';
        if (Math.abs(normal.z) > 0.5) normalAxis = 'z';

        const axes = ['x', 'y', 'z'];
        dragAxis = axes.find(a => a !== moveAxis && a !== normalAxis);

        if (dragAxis) {
            dragStartPoint.copy(currentPoint);
            const sliceVal = Math.round(startIntersect.object.position[dragAxis]);
            activeCubelets = cubelets.filter(c => Math.round(c.position[dragAxis]) === sliceVal);

            rotationPivot.position.set(0, 0, 0);
            rotationPivot.rotation.set(0, 0, 0);
            activeCubelets.forEach(c => {
                cubeGroup.remove(c);
                rotationPivot.add(c);
            });
        }
    }
  } else {
      // dynamic dragging visual update
      const normal = startIntersect.face.normal.clone().transformDirection(startIntersect.object.matrixWorld).round();
      const currentPoint = currentIntersect.point;
      const dx = currentPoint.x - dragStartPoint.x;
      const dy = currentPoint.y - dragStartPoint.y;
      const dz = currentPoint.z - dragStartPoint.z;

      let delta = 0;
      if (dragAxis === 'x') delta = normal.y !== 0 ? (normal.y > 0 ? dz : -dz) : (normal.z > 0 ? -dy : dy);
      if (dragAxis === 'y') delta = normal.x !== 0 ? (normal.x > 0 ? -dz : dz) : (normal.z > 0 ? dx : -dx);
      if (dragAxis === 'z') delta = normal.x !== 0 ? (normal.x > 0 ? dy : -dy) : (normal.y > 0 ? -dx : dx);

      rotationPivot.rotation[dragAxis] = delta;
  }
});

function getLogicalMove(axis, sliceVal, angle) {
    // Map slice and angle to notation
    const turns = Math.round(angle / (Math.PI/2));
    if (turns === 0) return null;
    let baseMove = '';
    if (axis === 'x') baseMove = sliceVal === 1 ? 'R' : (sliceVal === -1 ? 'L' : null);
    if (axis === 'y') baseMove = sliceVal === 1 ? 'U' : (sliceVal === -1 ? 'D' : null);
    if (axis === 'z') baseMove = sliceVal === 1 ? 'F' : (sliceVal === -1 ? 'B' : null);

    if (!baseMove) return null; // We don't support middle slice moves in standard notation for our solver right now, or we'd have to translate to M/E/S

    // adjust directions based on axis orientation
    let isClockwise = turns < 0; // default assumption
    if (axis === 'y') isClockwise = turns < 0;
    if (axis === 'x') isClockwise = turns < 0;
    if (axis === 'z') isClockwise = turns < 0;

    let moveStr = baseMove;
    if (Math.abs(turns) === 2) {
        moveStr += '2';
    } else {
        // Adjust for specific face orientations mapping to standard moves
        let finalClockwise = isClockwise;
        // The standard MOVE_MAP uses these angles:
        // U: -PI/2 (turns -1), D: PI/2 (turns 1)
        // R: -PI/2 (turns -1), L: PI/2 (turns 1)
        // F: -PI/2 (turns -1), B: PI/2 (turns 1)
        if (turns === 1) {
            if (baseMove === 'U' || baseMove === 'R' || baseMove === 'F') moveStr += "'";
        } else if (turns === -1) {
            if (baseMove === 'D' || baseMove === 'L' || baseMove === 'B') moveStr += "'";
        }
    }
    return moveStr;
}

window.addEventListener('pointerup', (event) => {
  if (isDragging) {
    isDragging = false;
    controls.enabled = true;

    if (dragAxis && activeCubelets.length > 0) {
      let angle = rotationPivot.rotation[dragAxis];
      let turns = Math.round(angle / (Math.PI/2));
      let targetAngle = turns * (Math.PI/2);

      const sliceVal = Math.round(startIntersect.object.position[dragAxis]);

      // Animate the snap
      isAnimating = true;
      const currentRotation = { value: angle };
      new TWEEN.Tween(currentRotation)
          .to({ value: targetAngle }, 150)
          .onUpdate(() => { rotationPivot.rotation[dragAxis] = currentRotation.value; })
          .onComplete(() => {
              rotationPivot.updateMatrixWorld();
              activeCubelets.forEach(c => {
                  rotationPivot.remove(c);
                  c.applyMatrix4(rotationPivot.matrixWorld);
                  cubeGroup.add(c);

                  c.position.x = Math.round(c.position.x);
                  c.position.y = Math.round(c.position.y);
                  c.position.z = Math.round(c.position.z);

                  const euler = new THREE.Euler().setFromQuaternion(c.quaternion);
                  c.rotation.x = Math.round(euler.x / (Math.PI/2)) * (Math.PI/2);
                  c.rotation.y = Math.round(euler.y / (Math.PI/2)) * (Math.PI/2);
                  c.rotation.z = Math.round(euler.z / (Math.PI/2)) * (Math.PI/2);
              });
              rotationPivot.rotation.set(0,0,0);

              if (turns !== 0) {
                  let moveStr = getLogicalMove(dragAxis, sliceVal, targetAngle);
                  if (moveStr && internalCube) {
                      internalCube.move(moveStr);
                  } else if (!moveStr && sliceVal === 0) {
                      // It's a middle slice move. Our simple internalCube solver logic only handles outer layers (U,D,L,R,F,B).
                      // If the user rotates the middle slice, it's equivalent to rotating the two outer slices in the opposite direction
                      // and rotating the whole cube. This invalidates standard state tracking.
                      // For simplicity, we just disallow middle slice logical tracking and snap it back or warn.
                      document.getElementById('message').innerText = "警告：不追蹤中間層的旋轉，求解器可能會失敗。";
                  }
              }

              dragAxis = null;
              activeCubelets = [];
              isAnimating = false;
          })
          .start();
    }
  }
});

let isBlankMode = false;
function handleClick(intersect) {
    if (!isBlankMode) return;
    // Cycle colors
    const obj = intersect.object;
    const faceIndex = Math.floor(intersect.faceIndex / 2); // 2 triangles per face
    const mat = obj.material[faceIndex];
    if (mat.color.getHex() === COLORS.BLANK) return; // Don't change internal faces

    const colorValues = [COLORS.R, COLORS.L, COLORS.U, COLORS.D, COLORS.F, COLORS.B];
    let currIdx = colorValues.indexOf(mat.color.getHex());
    currIdx = (currIdx + 1) % colorValues.length;
    mat.color.setHex(colorValues[currIdx]);
}

window.addEventListener('keydown', (event) => {
    if (!isBlankMode || !hoveredIntersect) return;

    const obj = hoveredIntersect.object;
    const faceIndex = Math.floor(hoveredIntersect.faceIndex / 2);
    const mat = obj.material[faceIndex];

    if (mat.color.getHex() === COLORS.BLANK) return;

    const keyMap = {
        'r': COLORS.R,
        'o': COLORS.L,
        'y': COLORS.D,
        'g': COLORS.F,
        'b': COLORS.B,
        'w': COLORS.U
    };

    const key = event.key.toLowerCase();
    if (keyMap[key] !== undefined) {
        mat.color.setHex(keyMap[key]);
    }
});

// Initialize Cube solver
Cube.initSolver();
let internalCube = new Cube(); // Solved by default

// Map standard move notation to animation params
// U, D: y-axis
// R, L: x-axis
// F, B: z-axis
const MOVE_MAP = {
    'U': { axis: 'y', val: 1, angle: -Math.PI / 2 },
    "U'": { axis: 'y', val: 1, angle: Math.PI / 2 },
    'U2': { axis: 'y', val: 1, angle: -Math.PI },
    'D': { axis: 'y', val: -1, angle: Math.PI / 2 },
    "D'": { axis: 'y', val: -1, angle: -Math.PI / 2 },
    'D2': { axis: 'y', val: -1, angle: Math.PI },

    'R': { axis: 'x', val: 1, angle: -Math.PI / 2 },
    "R'": { axis: 'x', val: 1, angle: Math.PI / 2 },
    'R2': { axis: 'x', val: 1, angle: -Math.PI },
    'L': { axis: 'x', val: -1, angle: Math.PI / 2 },
    "L'": { axis: 'x', val: -1, angle: -Math.PI / 2 },
    'L2': { axis: 'x', val: -1, angle: Math.PI },

    'F': { axis: 'z', val: 1, angle: -Math.PI / 2 },
    "F'": { axis: 'z', val: 1, angle: Math.PI / 2 },
    'F2': { axis: 'z', val: 1, angle: -Math.PI },
    'B': { axis: 'z', val: -1, angle: Math.PI / 2 },
    "B'": { axis: 'z', val: -1, angle: -Math.PI / 2 },
    'B2': { axis: 'z', val: -1, angle: Math.PI }
};

function animateMove(moveStr, duration = 300) {
    return new Promise((resolve) => {
        const move = MOVE_MAP[moveStr];
        if (!move) { resolve(); return; }

        isAnimating = true;

        // Select cubelets
        const sliceCubelets = cubelets.filter(c => Math.round(c.position[move.axis]) === move.val);

        // Attach to pivot
        rotationPivot.position.set(0,0,0);
        rotationPivot.rotation.set(0,0,0);
        sliceCubelets.forEach(c => {
            cubeGroup.remove(c);
            rotationPivot.add(c);
        });

        const targetRotation = { value: move.angle };
        const currentRotation = { value: 0 };

        new TWEEN.Tween(currentRotation)
            .to(targetRotation, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                rotationPivot.rotation[move.axis] = currentRotation.value;
            })
            .onComplete(() => {
                // Detach and update
                rotationPivot.updateMatrixWorld();
                sliceCubelets.forEach(c => {
                    rotationPivot.remove(c);
                    c.applyMatrix4(rotationPivot.matrixWorld);
                    cubeGroup.add(c);

                    c.position.x = Math.round(c.position.x);
                    c.position.y = Math.round(c.position.y);
                    c.position.z = Math.round(c.position.z);

                    const euler = new THREE.Euler().setFromQuaternion(c.quaternion);
                    c.rotation.x = Math.round(euler.x / (Math.PI/2)) * (Math.PI/2);
                    c.rotation.y = Math.round(euler.y / (Math.PI/2)) * (Math.PI/2);
                    c.rotation.z = Math.round(euler.z / (Math.PI/2)) * (Math.PI/2);
                });
                rotationPivot.rotation.set(0,0,0);

                // Update logical cube state
                internalCube.move(moveStr);

                isAnimating = false;
                resolve();
            })
            .start();
    });
}

async function executeSequence(sequenceStr, duration = 300) {
    if (!sequenceStr) return;
    const moves = sequenceStr.trim().split(/\s+/);
    for (let m of moves) {
        await animateMove(m, duration);
    }
}

// UI Handlers
document.getElementById('btn-shuffle').addEventListener('click', async () => {
    if (isAnimating) return;
    document.getElementById('message').innerText = "打亂中...";
    const rCube = Cube.random();
    // To animate a shuffle, we can just solve it from solved to random, but cube.js random() just creates state.
    // Instead, let's generate 20 random moves and apply them.
    const moveKeys = Object.keys(MOVE_MAP);
    let scramble = [];
    for(let i=0; i<20; i++) {
        scramble.push(moveKeys[Math.floor(Math.random() * moveKeys.length)]);
    }
    await executeSequence(scramble.join(' '), 150); // fast shuffle
    document.getElementById('message').innerText = "已打亂！";
});

document.getElementById('btn-solve').addEventListener('click', async () => {
    if (isAnimating) return;
    if (isBlankMode) {
        document.getElementById('message').innerText = "無法在自訂空白模式下自動求解。";
        return;
    }
    document.getElementById('message').innerText = "求解中...";

    // Check if already solved
    if (internalCube.isSolved()) {
        document.getElementById('message').innerText = "魔方已經解開了！";
        return;
    }

    try {
        const solution = internalCube.solve();
        if (solution) {
            document.getElementById('message').innerText = `解法: ${solution}`;
            await executeSequence(solution, 400);
            document.getElementById('message').innerText = "已解開！";
        } else {
             document.getElementById('message').innerText = "找不到解法。";
        }
    } catch(e) {
        document.getElementById('message').innerText = "求解發生錯誤: " + e.message;
    }
});

document.getElementById('btn-blank').addEventListener('click', () => {
    if (isAnimating) return;
    isBlankMode = !isBlankMode;
    const btn = document.getElementById('btn-blank');
    if (isBlankMode) {
        btn.innerText = "退出自訂模式";
        document.getElementById('message').innerText = "自訂模式：點擊方塊表面以更改顏色，或使用按鍵 (R紅, O橘, Y黃, G綠, B藍, W白) 快速設定。";
        // Set all to white
        cubelets.forEach(c => {
            c.material.forEach(m => {
                if (m.color.getHex() !== COLORS.BLANK) {
                    m.color.setHex(COLORS.U);
                }
            });
        });
    } else {

        btn.innerText = "自訂 (空白) 魔方";

        // Sync custom colors back to logical state
        // The cube.js facelet string order is U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9
        // U:y=1, R:x=1, F:z=1, D:y=-1, L:x=-1, B:z=-1
        // To build the string, we map 3D positions to the 2D facelets.

        const faceMap = {
            'U': { filter: c => c.position.y === 1, sortBy: (a,b) => (a.position.z - b.position.z)*10 + (a.position.x - b.position.x), matIdx: 2 },
            'R': { filter: c => c.position.x === 1, sortBy: (a,b) => (b.position.y - a.position.y)*10 + (b.position.z - a.position.z), matIdx: 0 },
            'F': { filter: c => c.position.z === 1, sortBy: (a,b) => (b.position.y - a.position.y)*10 + (a.position.x - b.position.x), matIdx: 4 },
            'D': { filter: c => c.position.y === -1, sortBy: (a,b) => (b.position.z - a.position.z)*10 + (a.position.x - b.position.x), matIdx: 3 },
            'L': { filter: c => c.position.x === -1, sortBy: (a,b) => (b.position.y - a.position.y)*10 + (a.position.z - b.position.z), matIdx: 1 },
            'B': { filter: c => c.position.z === -1, sortBy: (a,b) => (b.position.y - a.position.y)*10 + (b.position.x - a.position.x), matIdx: 5 }
        };

        const hexToChar = {};
        hexToChar[COLORS.U] = 'U';
        hexToChar[COLORS.R] = 'R';
        hexToChar[COLORS.F] = 'F';
        hexToChar[COLORS.D] = 'D';
        hexToChar[COLORS.L] = 'L';
        hexToChar[COLORS.B] = 'B';
        hexToChar[COLORS.BLANK] = 'U'; // default fallback

        let faceletStr = "";

        try {
            for (let face of ['U', 'R', 'F', 'D', 'L', 'B']) {
                let faceCubelets = cubelets.filter(faceMap[face].filter);
                faceCubelets.sort(faceMap[face].sortBy);
                for (let c of faceCubelets) {
                    // Need to find which face index of the mesh corresponds to the outer face.
                    // Because cubelets can be rotated, the initial material index mapping is no longer fixed to world axes.
                    // Instead, we cast a ray from outside the cube inwards to read the color.
                }
            }

            // To be totally robust regardless of rotations, let's just raycast from fixed positions for all 54 facelets.
            faceletStr = "";
            const faceCenters = {
                'U': { normal: new THREE.Vector3(0,1,0), up: new THREE.Vector3(0,0,-1), right: new THREE.Vector3(1,0,0) },
                'R': { normal: new THREE.Vector3(1,0,0), up: new THREE.Vector3(0,1,0), right: new THREE.Vector3(0,0,-1) },
                'F': { normal: new THREE.Vector3(0,0,1), up: new THREE.Vector3(0,1,0), right: new THREE.Vector3(1,0,0) },
                'D': { normal: new THREE.Vector3(0,-1,0), up: new THREE.Vector3(0,0,1), right: new THREE.Vector3(1,0,0) },
                'L': { normal: new THREE.Vector3(-1,0,0), up: new THREE.Vector3(0,1,0), right: new THREE.Vector3(0,0,1) },
                'B': { normal: new THREE.Vector3(0,0,-1), up: new THREE.Vector3(0,1,0), right: new THREE.Vector3(-1,0,0) }
            };

            const rc = new THREE.Raycaster();
            for (let face of ['U', 'R', 'F', 'D', 'L', 'B']) {
                let fc = faceCenters[face];
                for (let row = -1; row <= 1; row++) {
                    for (let col = -1; col <= 1; col++) {
                        let origin = fc.normal.clone().multiplyScalar(2)
                                        .add(fc.right.clone().multiplyScalar(col))
                                        .add(fc.up.clone().multiplyScalar(-row));
                        let dir = fc.normal.clone().multiplyScalar(-1);
                        rc.set(origin, dir);
                        let intersects = rc.intersectObjects(cubelets);
                        if (intersects.length > 0) {
                            let obj = intersects[0].object;
                            let fIdx = Math.floor(intersects[0].faceIndex / 2);
                            let colorHex = obj.material[fIdx].color.getHex();
                            faceletStr += hexToChar[colorHex] || 'U';
                        } else {
                            faceletStr += 'U';
                        }
                    }
                }
            }

            let newCube = Cube.fromString(faceletStr);
            internalCube = newCube;
            document.getElementById('message').innerText = "已載入自訂狀態！現在可以開始求解。";
        } catch(e) {
            document.getElementById('message').innerText = "無效的自訂魔方狀態！(無法求解此配置)";
        }

        /* message is set by raycast logic above */
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (isAnimating) return;
    location.reload(); // Simplest way to cleanly reset visual and internal state
});
