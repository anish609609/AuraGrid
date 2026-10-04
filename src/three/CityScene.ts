import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingData, BuildingId, EnvironmentState } from '../types/city';

export interface SceneCallbacks {
  onBuildingSelect: (buildingId: BuildingId) => void;
  onBuildingHover: (buildingId: BuildingId | null, screenPos?: { x: number; y: number }) => void;
  onFeederSubstationSelect?: () => void;
}

export class CityScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationFrameId: number | null = null;
  private callbacks: SceneCallbacks;

  // Lights
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private hemisphereLight: THREE.HemisphereLight;

  // Ground and underground infrastructure
  private groundMesh: THREE.Mesh | null = null;
  private surfaceMeshes: THREE.Mesh[] = [];
  private basementMeshes: THREE.Object3D[] = [];
  private undergroundConduitMaterials: THREE.MeshStandardMaterial[] = [];
  private undergroundParticles: THREE.PointsMaterial[] = [];
  private feederSubstationGroup: THREE.Group | null = null;
  public isUndergroundMode = false;

  // Interactive meshes
  private buildingMeshMap: Map<BuildingId, THREE.Group> = new Map();
  private buildingDataMap: Map<BuildingId, BuildingData> = new Map();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Highlight state
  private hoveredBuildingId: BuildingId | null = null;
  private selectedBuildingId: BuildingId | null = null;
  private isHoveringFeeder = false;

  // Camera animation - elevated default camera for clear district & external grid overview
  private targetCameraPos = new THREE.Vector3(0, 52, 60);
  private targetLookAt = new THREE.Vector3(0, 2, -10);
  private currentLookAt = new THREE.Vector3(0, 2, -10);
  private isCameraTransitioning = false;

  // Grid & Power animation
  private powerParticles: {
    points: THREE.Points;
    curve: THREE.CatmullRomCurve3;
    progressArray: Float32Array;
    speed: number;
  }[] = [];

  // Moving vehicles
  private vehicles: {
    mesh: THREE.Group;
    path: THREE.Vector3[];
    progress: number;
    speed: number;
  }[] = [];

  // Grid node meshes
  private gridNodeMeshes: THREE.Group[] = [];

  constructor(container: HTMLElement, buildings: BuildingData[], callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.006);

    // 2. Camera setup - elevated command center perspective
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 380);
    this.camera.position.set(0, 52, 60);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 4. Controls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 145;
    this.controls.target.set(0, 2, -10);

    // 5. Lighting - realistic bright daytime baseline
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 1.15);
    this.scene.add(this.hemisphereLight);

    this.dirLight = new THREE.DirectionalLight(0xfff8ee, 3.0);
    this.dirLight.position.set(38, 65, 32);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 200;
    const d = 55;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.radius = 2.5;
    this.scene.add(this.dirLight);

    // Store building data
    buildings.forEach((b) => this.buildingDataMap.set(b.id, b));

    // 6. Build the urban environment with defined parcels, underground grid & external feeder
    this.buildGroundAndRoads();
    this.buildBuildings(buildings);
    this.buildGridNodes();
    this.buildUndergroundPowerGrid();
    this.buildTreesAndProps();
    this.buildVehicles();

    // 7. Event listeners
    this.bindEvents();

    // 8. Start loop
    this.animate();
  }

  // Toggle Underground Infrastructure / X-Ray mode
  public setUndergroundMode(enabled: boolean) {
    this.isUndergroundMode = enabled;

    // 1. Ground plane transparency (opacity ~0.16)
    if (this.groundMesh) {
      const mat = this.groundMesh.material as THREE.MeshStandardMaterial;
      if (enabled) {
        mat.transparent = true;
        mat.opacity = 0.16;
        mat.roughness = 0.1;
        mat.depthWrite = false;
      } else {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.roughness = 0.85;
        mat.depthWrite = true;
      }
    }

    // 2. Surface meshes transparency (roads, parcel curbs, podium lawns, street furniture)
    this.surfaceMeshes.forEach((mesh) => {
      if (enabled) {
        if (!mesh.userData.origMaterial) {
          mesh.userData.origMaterial = mesh.material;
        }
        const origColor = (mesh.userData.origMaterial as THREE.MeshStandardMaterial).color
          ? (mesh.userData.origMaterial as THREE.MeshStandardMaterial).color.getHex()
          : 0x1e293b;
        mesh.material = new THREE.MeshStandardMaterial({
          color: origColor,
          transparent: true,
          opacity: 0.18,
          roughness: 0.2,
          depthWrite: false,
        });
      } else if (mesh.userData.origMaterial) {
        mesh.material = mesh.userData.origMaterial;
      }
    });

    // 3. Subterranean basements & electrical vaults highlighting
    this.basementMeshes.forEach((vault) => {
      vault.visible = true;
      vault.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isVaultCore) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = enabled ? 1.0 : 0.25;
        }
      });
    });

    // 4. High-transparency glass/X-ray shader for all 3D building superstructures (opacity ~0.18)
    this.buildingMeshMap.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name === 'selectionRing') return;

          if (enabled) {
            if (!child.userData.origMaterial) {
              child.userData.origMaterial = child.material;
            }
            const origColor = child.userData.origMaterial.color ? child.userData.origMaterial.color.getHex() : 0x38bdf8;
            child.material = new THREE.MeshStandardMaterial({
              color: origColor,
              transparent: true,
              opacity: 0.18,
              roughness: 0.15,
              metalness: 0.85,
              depthWrite: false,
            });
          } else if (child.userData.origMaterial) {
            child.material = child.userData.origMaterial;
          }
        }
      });
    });

    // 5. Boost emissive glow of underground conduits and particles
    this.undergroundConduitMaterials.forEach((m) => {
      m.emissiveIntensity = enabled ? 1.35 : 0.45;
    });
    this.undergroundParticles.forEach((p) => {
      p.size = enabled ? 0.75 : 0.48;
      p.opacity = enabled ? 1.0 : 0.85;
    });
  }

  // Ground and road network with distinct block parcels & curbs
  private buildGroundAndRoads() {
    // 1. Main terrain plane
    const groundGeo = new THREE.PlaneGeometry(210, 210, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Rich slate ground
      roughness: 0.85,
      metalness: 0.15,
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Subtle technological grid pattern
    const gridHelper = new THREE.GridHelper(160, 80, 0x1e293b, 0x0f172a);
    gridHelper.position.y = 0.015;
    this.scene.add(gridHelper);

    // 2. Concrete sidewalk block parcels (raised 0.15m)
    // North Corporate Tech Plaza (IT Tower): centered at (0, 0, -32)
    this.createParcelPodium(0, 0.08, -32, 22, 18, 0x1e293b, 0x064e3b);

    // North-West Academic Block (Education): centered at (-16, 0, -11)
    this.createParcelPodium(-16, 0.08, -11, 16, 16, 0x1e293b, 0x064e3b);

    // North-East Healthcare Block (Hospital): centered at (16, 0, -11)
    this.createParcelPodium(16, 0.08, -11, 16, 16, 0x1e293b, 0x064e3b);

    // South-West Residential Block: centered at (-16, 0, 11)
    this.createParcelPodium(-16, 0.08, 11, 16, 16, 0x1e293b, 0x064e3b);

    // South-East Commercial Block (Retail): centered at (16, 0, 11)
    this.createParcelPodium(16, 0.08, 11, 16, 16, 0x1e293b, 0x064e3b);

    // 3. Road Network
    // Central North-South Avenue: x = 0, running between z = -22 and z = 22
    this.createRoadSegment(0, 0.04, 0, 6, 44);

    // Central East-West Boulevard: z = 0, running from x = -35 to x = 35
    this.createRoadSegment(0, 0.04, 0, 70, 6);

    // North Cross Street: z = -22, running from x = -35 to x = 35
    this.createRoadSegment(0, 0.04, -22, 70, 5);

    // South Cross Street: z = 22, running from x = -35 to x = 35
    this.createRoadSegment(0, 0.04, 22, 70, 5);

    // Avenue North Extension leading to IT Corporate Plaza: x = 0, z = -25
    this.createRoadSegment(0, 0.04, -25, 6, 6);
  }

  // Creates a raised block parcel with concrete sidewalk curb & landscaped lawn
  private createParcelPodium(x: number, y: number, z: number, w: number, d: number, curbColor: number, parkColor: number) {
    const parcelGroup = new THREE.Group();
    parcelGroup.position.set(x, y, z);

    const curbGeo = new THREE.BoxGeometry(w, 0.16, d);
    const curbMat = new THREE.MeshStandardMaterial({
      color: curbColor,
      roughness: 0.75,
      metalness: 0.2,
    });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.receiveShadow = true;
    curb.castShadow = true;
    parcelGroup.add(curb);
    this.surfaceMeshes.push(curb);

    const parkGeo = new THREE.BoxGeometry(w - 2.5, 0.04, d - 2.5);
    const parkMat = new THREE.MeshStandardMaterial({
      color: parkColor,
      roughness: 0.9,
    });
    const park = new THREE.Mesh(parkGeo, parkMat);
    park.position.y = 0.09;
    park.receiveShadow = true;
    parcelGroup.add(park);
    this.surfaceMeshes.push(park);

    this.scene.add(parcelGroup);
  }

  private createRoadSegment(x: number, y: number, z: number, w: number, d: number) {
    const roadGroup = new THREE.Group();
    roadGroup.position.set(x, y, z);

    const geo = new THREE.PlaneGeometry(w, d);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x172033,
      roughness: 0.78,
      metalness: 0.22,
    });
    const roadMesh = new THREE.Mesh(geo, mat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);
    this.surfaceMeshes.push(roadMesh);

    if (d > w) {
      const lineCount = Math.floor(d / 4);
      for (let i = -lineCount / 2; i <= lineCount / 2; i++) {
        const stripeGeo = new THREE.PlaneGeometry(0.25, 2);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.015, i * 4);
        roadGroup.add(stripe);
        this.surfaceMeshes.push(stripe);
      }
    } else {
      const lineCount = Math.floor(w / 4);
      for (let i = -lineCount / 2; i <= lineCount / 2; i++) {
        const stripeGeo = new THREE.PlaneGeometry(2, 0.25);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(i * 4, 0.015, 0);
        roadGroup.add(stripe);
        this.surfaceMeshes.push(stripe);
      }
    }

    this.scene.add(roadGroup);
  }

  // Creates subterranean electrical basement vault & transformer gear beneath building foundation
  private createBuildingBasementVault(b: BuildingData): THREE.Group {
    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(b.position3D[0], -1.2, b.position3D[2]);

    const vw = b.dimensions3D[0] * 0.75;
    const vd = b.dimensions3D[2] * 0.75;
    const vh = 1.5;

    // Concrete subterranean basement bunker walls
    const boxGeo = new THREE.BoxGeometry(vw, vh, vd);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.3,
    });
    const vaultBox = new THREE.Mesh(boxGeo, boxMat);
    vaultGroup.add(vaultBox);

    // Glowing electrical transformer core & substation breaker racks inside basement
    const coreGeo = new THREE.BoxGeometry(vw * 0.45, vh * 0.7, vd * 0.45);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: new THREE.Color(b.accentColor).getHex(),
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.userData = { isVaultCore: true };
    vaultGroup.add(coreMesh);

    return vaultGroup;
  }

  // Procedural Building construction
  private buildBuildings(buildings: BuildingData[]) {
    buildings.forEach((b) => {
      // Subterranean electrical basement vault (Requirement 3: clear X-ray down to underground basements)
      const basement = this.createBuildingBasementVault(b);
      this.scene.add(basement);
      this.basementMeshes.push(basement);

      let group: THREE.Group;
      switch (b.id) {
        case 'it-tower':
          group = this.createITTower(b);
          break;
        case 'education':
          group = this.createEducationBuilding(b);
          break;
        case 'hospital':
          group = this.createHospitalBuilding(b);
          break;
        case 'residential':
          group = this.createResidentialBuilding(b);
          break;
        case 'retail':
          group = this.createRetailBuilding(b);
          break;
      }

      group.userData = { buildingId: b.id };
      this.scene.add(group);
      this.buildingMeshMap.set(b.id, group);
    });
  }

  // 3D Solar Panel Rack Generator
  private createSolarArray(width: number, length: number, tiltAngle = 0.32): THREE.Group {
    const arrayGroup = new THREE.Group();

    const frameGeo = new THREE.BoxGeometry(width + 0.1, 0.08, length + 0.1);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.25,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    arrayGroup.add(frame);

    const cellGeo = new THREE.PlaneGeometry(width, length);
    const cellMat = new THREE.MeshStandardMaterial({
      color: 0x0a1428,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x0369a1,
      emissiveIntensity: 0.2,
    });
    const cells = new THREE.Mesh(cellGeo, cellMat);
    cells.rotation.x = -Math.PI / 2;
    cells.position.y = 0.045;
    arrayGroup.add(cells);

    const numBars = 4;
    for (let i = 0; i <= numBars; i++) {
      const barGeo = new THREE.PlaneGeometry(0.04, length);
      const barMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.rotation.x = -Math.PI / 2;
      bar.position.set(-width / 2 + (i * width) / numBars, 0.048, 0);
      arrayGroup.add(bar);
    }

    arrayGroup.rotation.x = tiltAngle;
    return arrayGroup;
  }

  // 1. IT Building
  private createITTower(b: BuildingData): THREE.Group {
    const group = new THREE.Group();
    group.position.set(b.position3D[0], b.position3D[1], b.position3D[2]);

    const towerHeight = b.dimensions3D[1];
    const towerWidth = b.dimensions3D[0];
    const towerDepth = b.dimensions3D[2];

    const towerGeo = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x0f223d,
      roughness: 0.12,
      metalness: 0.88,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = towerHeight / 2 + 0.16;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    for (let f = 1; f < 10; f++) {
      const y = (f / 10) * towerHeight + 0.16;
      const bandGeo = new THREE.BoxGeometry(towerWidth + 0.15, 0.45, towerDepth + 0.15);
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.65,
        roughness: 0.2,
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = y;
      group.add(band);
    }

    const crownGeo = new THREE.BoxGeometry(towerWidth * 0.75, 3, towerDepth * 0.75);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3,
    });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = towerHeight + 1.5 + 0.16;
    crown.castShadow = true;
    group.add(crown);

    for (let c = -1; c <= 1; c += 2) {
      const chillGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
      const chillMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
      const chill = new THREE.Mesh(chillGeo, chillMat);
      chill.position.set(c * 1.8, towerHeight + 3.6 + 0.16, -1);
      group.add(chill);
    }

    const solar1 = this.createSolarArray(3.2, 2.2, 0.28);
    solar1.position.set(-1.8, towerHeight + 4.5 + 0.16, 1.5);
    group.add(solar1);

    const solar2 = this.createSolarArray(3.2, 2.2, 0.28);
    solar2.position.set(1.8, towerHeight + 4.5 + 0.16, 1.5);
    group.add(solar2);

    const antennaGeo = new THREE.CylinderGeometry(0.08, 0.15, 4.5, 8);
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(0, towerHeight + 5.5 + 0.16, 0);
    group.add(antenna);

    const beaconGeo = new THREE.SphereGeometry(0.28, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, towerHeight + 7.8 + 0.16, 0);
    group.add(beacon);

    const baseGeo = new THREE.BoxGeometry(towerWidth + 2.5, 1.2, towerDepth + 2.5);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.6 + 0.16;
    base.receiveShadow = true;
    group.add(base);

    const ringGeo = new THREE.RingGeometry(towerWidth * 0.72, towerWidth * 0.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    ring.name = 'selectionRing';
    group.add(ring);

    return group;
  }

  // 2. Education Building
  private createEducationBuilding(b: BuildingData): THREE.Group {
    const group = new THREE.Group();
    group.position.set(b.position3D[0], b.position3D[1], b.position3D[2]);

    const h = b.dimensions3D[1];
    const w = b.dimensions3D[0];
    const d = b.dimensions3D[2];

    const hubGeo = new THREE.BoxGeometry(w * 0.55, h, d * 0.8);
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0x1e2433,
      roughness: 0.35,
      metalness: 0.45,
    });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.y = h / 2 + 0.16;
    hub.castShadow = true;
    hub.receiveShadow = true;
    group.add(hub);

    const leftWingGeo = new THREE.BoxGeometry(w * 0.45, h * 0.75, d * 0.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x272d3f, roughness: 0.5 });
    const leftWing = new THREE.Mesh(leftWingGeo, wingMat);
    leftWing.position.set(-w * 0.35, (h * 0.75) / 2 + 0.16, 0);
    leftWing.castShadow = true;
    leftWing.receiveShadow = true;
    group.add(leftWing);

    const rightWingGeo = new THREE.BoxGeometry(w * 0.45, h * 0.75, d * 0.5);
    const rightWing = new THREE.Mesh(rightWingGeo, wingMat);
    rightWing.position.set(w * 0.35, (h * 0.75) / 2 + 0.16, 0);
    rightWing.castShadow = true;
    rightWing.receiveShadow = true;
    group.add(rightWing);

    const atriumGeo = new THREE.BoxGeometry(w * 0.35, h * 0.5, 2.5);
    const atriumMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      roughness: 0.1,
      metalness: 0.8,
    });
    const atrium = new THREE.Mesh(atriumGeo, atriumMat);
    atrium.position.set(0, (h * 0.5) / 2 + 0.16, d * 0.38);
    group.add(atrium);

    // MAXIMUM HIGH-DENSITY ROOFTOP SOLAR COVERAGE (Requirement 4)
    // 1. Central academic hub: 4 full-span rows of tilted photovoltaic arrays
    for (let row = -1.5; row <= 1.5; row++) {
      const solarRow = this.createSolarArray(5.6, 1.5, 0.35);
      solarRow.position.set(0, h + 0.45 + 0.16, row * 1.8);
      group.add(solarRow);
    }

    // 2. Left science wing: 2 rows of high-density solar arrays
    for (let r of [-1, 1]) {
      const leftSolar = this.createSolarArray(4.2, 1.4, 0.35);
      leftSolar.position.set(-w * 0.35, h * 0.75 + 0.45 + 0.16, r * 1.4);
      group.add(leftSolar);
    }

    // 3. Right laboratory wing: 2 rows of high-density solar arrays
    for (let r of [-1, 1]) {
      const rightSolar = this.createSolarArray(4.2, 1.4, 0.35);
      rightSolar.position.set(w * 0.35, h * 0.75 + 0.45 + 0.16, r * 1.4);
      group.add(rightSolar);
    }

    // 4. Atrium rooftop solar glass array
    const atriumSolar = this.createSolarArray(3.8, 1.6, 0.2);
    atriumSolar.position.set(0, h * 0.5 + 0.45 + 0.16, d * 0.38);
    group.add(atriumSolar);

    const ringGeo = new THREE.RingGeometry(w * 0.6, w * 0.68, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    ring.name = 'selectionRing';
    group.add(ring);

    return group;
  }

  // 3. Hospital
  private createHospitalBuilding(b: BuildingData): THREE.Group {
    const group = new THREE.Group();
    group.position.set(b.position3D[0], b.position3D[1], b.position3D[2]);

    const h = b.dimensions3D[1];
    const w = b.dimensions3D[0];
    const d = b.dimensions3D[2];

    const towerGeo = new THREE.BoxGeometry(w, h, d);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.22,
      metalness: 0.55,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = h / 2 + 0.16;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    for (let f = 1; f < 6; f++) {
      const bandGeo = new THREE.BoxGeometry(w + 0.1, 0.6, d + 0.1);
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xbe123c,
        emissiveIntensity: 0.45,
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = (f / 6) * h + 0.16;
      group.add(band);
    }

    const crossHGeo = new THREE.BoxGeometry(2.4, 0.7, 0.3);
    const crossVGeo = new THREE.BoxGeometry(0.7, 2.4, 0.3);
    const crossMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff1744,
      emissiveIntensity: 1.0,
    });
    const crossH = new THREE.Mesh(crossHGeo, crossMat);
    const crossV = new THREE.Mesh(crossVGeo, crossMat);
    crossH.position.set(0, h * 0.75 + 0.16, d / 2 + 0.2);
    crossV.position.set(0, h * 0.75 + 0.16, d / 2 + 0.2);
    group.add(crossH);
    group.add(crossV);

    const helipadGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.3, 32);
    const helipadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const helipad = new THREE.Mesh(helipadGeo, helipadMat);
    helipad.position.set(0, h + 0.2 + 0.16, 0);
    group.add(helipad);

    const padRingGeo = new THREE.RingGeometry(2.8, 3.1, 32);
    const padRingMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const padRing = new THREE.Mesh(padRingGeo, padRingMat);
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.set(0, h + 0.36 + 0.16, 0);
    group.add(padRing);

    const emergGeo = new THREE.BoxGeometry(w * 0.6, 2.2, 3);
    const emergMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const emerg = new THREE.Mesh(emergGeo, emergMat);
    emerg.position.set(0, 1.1 + 0.16, d / 2 + 1.5);
    group.add(emerg);

    const ringGeo = new THREE.RingGeometry(w * 0.65, w * 0.72, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    ring.name = 'selectionRing';
    group.add(ring);

    return group;
  }

  // 4. Residential Complex
  private createResidentialBuilding(b: BuildingData): THREE.Group {
    const group = new THREE.Group();
    group.position.set(b.position3D[0], b.position3D[1], b.position3D[2]);

    const h = b.dimensions3D[1];
    const w = b.dimensions3D[0];
    const d = b.dimensions3D[2];

    const blockGeo = new THREE.BoxGeometry(w, h, d);
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x13231e,
      roughness: 0.6,
      metalness: 0.2,
    });
    const block = new THREE.Mesh(blockGeo, blockMat);
    block.position.y = h / 2 + 0.16;
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);

    for (let f = 1; f < 8; f++) {
      const y = (f / 8) * h + 0.16;
      for (let side = -1; side <= 1; side += 2) {
        const balcGeo = new THREE.BoxGeometry(2.4, 0.4, 0.8);
        const balcMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.4,
        });
        const balc1 = new THREE.Mesh(balcGeo, balcMat);
        balc1.position.set(-2, y, (d / 2 + 0.4) * side);
        group.add(balc1);

        const balc2 = new THREE.Mesh(balcGeo, balcMat);
        balc2.position.set(2, y, (d / 2 + 0.4) * side);
        group.add(balc2);
      }
    }

    const pergolaGeo = new THREE.BoxGeometry(w * 0.7, 1.2, d * 0.7);
    const pergolaMat = new THREE.MeshStandardMaterial({
      color: 0x047857,
      roughness: 0.7,
      wireframe: true,
    });
    const pergola = new THREE.Mesh(pergolaGeo, pergolaMat);
    pergola.position.y = h + 0.6 + 0.16;
    group.add(pergola);

    const evGeo = new THREE.BoxGeometry(4, 1.2, 2.5);
    const evMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
    });
    const evBay = new THREE.Mesh(evGeo, evMat);
    evBay.position.set(0, 0.6 + 0.16, d / 2 + 1.8);
    group.add(evBay);

    const ringGeo = new THREE.RingGeometry(w * 0.6, w * 0.68, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    ring.name = 'selectionRing';
    group.add(ring);

    return group;
  }

  // 5. Retail / Community Center
  private createRetailBuilding(b: BuildingData): THREE.Group {
    const group = new THREE.Group();
    group.position.set(b.position3D[0], b.position3D[1], b.position3D[2]);

    const h = b.dimensions3D[1];
    const w = b.dimensions3D[0];
    const d = b.dimensions3D[2];

    const mallGeo = new THREE.BoxGeometry(w, h, d);
    const mallMat = new THREE.MeshStandardMaterial({
      color: 0x221730,
      roughness: 0.3,
      metalness: 0.5,
    });
    const mall = new THREE.Mesh(mallGeo, mallMat);
    mall.position.y = h / 2 + 0.16;
    mall.castShadow = true;
    mall.receiveShadow = true;
    group.add(mall);

    const glassGeo = new THREE.BoxGeometry(w * 0.7, h * 0.7, 0.4);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.7,
      roughness: 0.1,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, (h * 0.7) / 2 + 0.5 + 0.16, d / 2 + 0.1);
    group.add(glass);

    const signGeo = new THREE.BoxGeometry(w * 0.8, 0.8, 0.5);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xd8b4fe,
      emissive: 0x9333ea,
      emissiveIntensity: 0.9,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, h * 0.8 + 0.16, d / 2 + 0.2);
    group.add(sign);

    const retailSolar1 = this.createSolarArray(4.5, 2.5, 0.25);
    retailSolar1.position.set(-3, h + 0.45 + 0.16, -1);
    group.add(retailSolar1);

    const retailSolar2 = this.createSolarArray(4.5, 2.5, 0.25);
    retailSolar2.position.set(3, h + 0.45 + 0.16, -1);
    group.add(retailSolar2);

    const ringGeo = new THREE.RingGeometry(w * 0.62, w * 0.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    ring.name = 'selectionRing';
    group.add(ring);

    return group;
  }

  // Grid substations and dedicated External Regional 230kV Feeder Substation
  private buildGridNodes() {
    // 1. External High-Voltage Feeder Substation (Outside city block perimeter at z = -56)
    this.buildExternalFeederSubstation();

    // 2. City Center Subterranean Distribution Vaults Alpha & Beta (Relocated completely underground)
    const nodes = [
      { name: 'Grid Node Alpha', pos: [-4, -1.8, -21] as [number, number, number], color: 0x38bdf8 },
      { name: 'Grid Node Beta', pos: [4, -1.8, 21] as [number, number, number], color: 0x10b981 },
    ];

    nodes.forEach((n) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(n.pos[0], n.pos[1], n.pos[2]);

      // 1. Reinforced concrete subterranean vault box
      const vaultGeo = new THREE.BoxGeometry(4.4, 1.8, 4.4);
      const vaultMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.7,
        metalness: 0.3,
      });
      const vault = new THREE.Mesh(vaultGeo, vaultMat);
      nodeGroup.add(vault);

      // 2. Subterranean step-down transformer & distribution switchgear
      const coreGeo = new THREE.BoxGeometry(2.4, 1.2, 2.4);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: n.color,
        emissiveIntensity: 0.75,
        metalness: 0.8,
        roughness: 0.2,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.userData = { isVaultCore: true, isGridNode: true };
      nodeGroup.add(core);

      // 3. Glowing electromagnetic induction ring inside vault
      const ringGeo = new THREE.TorusGeometry(1.3, 0.14, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: n.color,
        emissive: n.color,
        emissiveIntensity: 0.95,
        roughness: 0.1,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.25;
      ring.userData = { isVaultCore: true };
      nodeGroup.add(ring);

      // 4. Street-level flush manhole utility plate (y = +1.83 from vault center = y = 0.03 on road)
      // Completely flush so autonomous electric shuttles and vehicles pass cleanly over it without obstruction
      const hatchGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.03, 24);
      const hatchMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.6,
        metalness: 0.7,
      });
      const hatch = new THREE.Mesh(hatchGeo, hatchMat);
      hatch.position.y = 1.82;
      nodeGroup.add(hatch);
      this.surfaceMeshes.push(hatch);

      const markerGeo = new THREE.RingGeometry(0.65, 0.8, 24);
      const markerMat = new THREE.MeshBasicMaterial({ color: n.color, side: THREE.DoubleSide });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.rotation.x = -Math.PI / 2;
      marker.position.y = 1.845;
      nodeGroup.add(marker);
      this.surfaceMeshes.push(marker);

      this.scene.add(nodeGroup);
      this.basementMeshes.push(nodeGroup);
      this.gridNodeMeshes.push(nodeGroup);
    });
  }

  // Dedicated Regional 230kV Grid Supply Substation outside city perimeter
  private buildExternalFeederSubstation() {
    const yardGroup = new THREE.Group();
    yardGroup.position.set(0, 0, -56);

    // Foundation perimeter gravel & concrete pad
    const padGeo = new THREE.BoxGeometry(26, 0.3, 16);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.15;
    pad.receiveShadow = true;
    yardGroup.add(pad);

    // High-voltage transmission steel lattice gantry tower
    const gantryGeo = new THREE.BoxGeometry(20, 0.4, 0.4);
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85 });
    const crossbeam = new THREE.Mesh(gantryGeo, gantryMat);
    crossbeam.position.y = 8.5;
    yardGroup.add(crossbeam);

    // Vertical pylon towers for the gantry
    for (let px of [-9.5, 9.5]) {
      const pylonGeo = new THREE.CylinderGeometry(0.3, 0.5, 8.5, 8);
      const pylon = new THREE.Mesh(pylonGeo, gantryMat);
      pylon.position.set(px, 4.25, 0);
      pylon.castShadow = true;
      yardGroup.add(pylon);
    }

    // High-voltage ceramic insulator strings hanging from gantry (orange/amber)
    for (let insX = -7; insX <= 7; insX += 3.5) {
      const insGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.8, 8);
      const insMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 0.7,
      });
      const ins = new THREE.Mesh(insGeo, insMat);
      ins.position.set(insX, 7.4, 0);
      yardGroup.add(ins);
    }

    // 3 Heavy-duty 230kV step-down transformer tanks with radiator cooling banks
    for (let tx of [-6, 0, 6]) {
      const tankGeo = new THREE.BoxGeometry(3.5, 3.8, 3.2);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(tx, 2.0, 3.5);
      tank.castShadow = true;
      yardGroup.add(tank);

      // Radiator cooling fins
      const radGeo = new THREE.BoxGeometry(0.2, 2.8, 3.0);
      const radMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const rad1 = new THREE.Mesh(radGeo, radMat);
      rad1.position.set(tx - 2.0, 2.0, 3.5);
      const rad2 = new THREE.Mesh(radGeo, radMat);
      rad2.position.set(tx + 2.0, 2.0, 3.5);
      yardGroup.add(rad1);
      yardGroup.add(rad2);

      // High voltage oil bushings on top
      for (let bx = -0.8; bx <= 0.8; bx += 0.8) {
        const bushGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8);
        const bushMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.8 });
        const bush = new THREE.Mesh(bushGeo, bushMat);
        bush.position.set(tx + bx, 4.4, 3.5);
        yardGroup.add(bush);
      }
    }

    // Perimeter security fence posts
    for (let fx = -12; fx <= 12; fx += 6) {
      for (let fz of [-7, 7]) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
        );
        post.position.set(fx, 1.1, fz);
        yardGroup.add(post);
      }
    }

    // Holographic energy beacon beam
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.7 })
    );
    beacon.position.set(0, 9, 3.5);
    yardGroup.add(beacon);

    yardGroup.userData = { isFeederSubstation: true };
    yardGroup.traverse((child) => {
      child.userData.isFeederSubstation = true;
    });

    this.feederSubstationGroup = yardGroup;
    this.scene.add(yardGroup);
  }

  // Builds underground power distribution conduits connecting subterranean vaults
  private buildUndergroundPowerGrid() {
    // 1. External High-Voltage Inflow Trunk Conduits (connecting Regional Feeder to underground distribution vaults)
    const trunkConnections: {
      from: [number, number, number];
      to: [number, number, number];
      color: number;
      isTrunk: boolean;
    }[] = [
      // Regional Feeder (0, -2.0, -56) -> Substation Alpha Vault (-4, -1.8, -21)
      { from: [0, -2.0, -56], to: [-4, -1.8, -21], color: 0xfbbf24, isTrunk: true },
      // Regional Feeder (0, -2.2, -56) -> Substation Beta Vault (4, -1.8, 21)
      { from: [0, -2.2, -56], to: [4, -1.8, 21], color: 0xf59e0b, isTrunk: true },
    ];

    // 2. City District Underground Distribution Conduits
    const districtConnections: {
      from: [number, number, number];
      to: [number, number, number];
      color: number;
      isTrunk: boolean;
    }[] = [
      // Node A (-4, -1.8, -21) -> IT Tower basement (0, -1.8, -32)
      { from: [-4, -1.8, -21], to: [0, -1.8, -32], color: 0x38bdf8, isTrunk: false },
      // Node A (-4, -1.8, -21) -> Education basement (-16, -1.8, -11)
      { from: [-4, -1.8, -21], to: [-16, -1.8, -11], color: 0xfbbf24, isTrunk: false },
      // Node A (-4, -1.8, -21) -> Hospital basement (16, -1.8, -11)
      { from: [-4, -1.8, -21], to: [16, -1.8, -11], color: 0xf43f5e, isTrunk: false },
      // Inter-tie: Node A (-4, -2.0, -21) -> Node B (4, -2.0, 21)
      { from: [-4, -2.0, -21], to: [4, -2.0, 21], color: 0x38bdf8, isTrunk: false },
      // Node B (4, -1.8, 21) -> Hospital basement (16, -1.8, -11)
      { from: [4, -1.8, 21], to: [16, -1.8, -11], color: 0xf43f5e, isTrunk: false },
      // Node B (4, -1.8, 21) -> Residential basement (-16, -1.8, 11)
      { from: [4, -1.8, 21], to: [-16, -1.8, 11], color: 0x10b981, isTrunk: false },
      // Node B (4, -1.8, 21) -> Retail basement (16, -1.8, 11)
      { from: [4, -1.8, 21], to: [16, -1.8, 11], color: 0xa855f7, isTrunk: false },
    ];

    const allConnections = [...trunkConnections, ...districtConnections];

    allConnections.forEach((c) => {
      // Curve points running strictly underground
      const midZ = (c.from[2] + c.to[2]) / 2;
      const midX = (c.from[0] + c.to[0]) / 2;
      const midY = Math.min(c.from[1], c.to[1]) - 0.2;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(...c.from),
        new THREE.Vector3(midX, midY, midZ),
        new THREE.Vector3(...c.to),
      ]);

      const radius = c.isTrunk ? 0.16 : 0.10;
      const tubeGeo = new THREE.TubeGeometry(curve, 28, radius, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: c.color,
        emissiveIntensity: c.isTrunk ? 0.65 : 0.45,
        roughness: 0.25,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      this.scene.add(tube);
      this.undergroundConduitMaterials.push(tubeMat);

      // Glowing traveling energy particles along underground conduit
      const particleCount = c.isTrunk ? 28 : 20;
      const progressArray = new Float32Array(particleCount);
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        progressArray[i] = i / particleCount;
        const pt = curve.getPoint(progressArray[i]);
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;
      }

      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: c.color,
        size: c.isTrunk ? 0.64 : 0.48,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(particleGeo, particleMat);
      this.scene.add(points);
      this.undergroundParticles.push(particleMat);

      this.powerParticles.push({
        points,
        curve,
        progressArray,
        speed: c.isTrunk ? 0.18 : 0.12,
      });
    });

    // Risers inside building basements connecting to building vaults
    this.createVerticalRiser(0, -1.8, -32, 0.4, 0x38bdf8);
    this.createVerticalRiser(-16, -1.8, -11, 0.4, 0xfbbf24);
    this.createVerticalRiser(16, -1.8, -11, 0.4, 0xf43f5e);
    this.createVerticalRiser(-16, -1.8, 11, 0.4, 0x10b981);
    this.createVerticalRiser(16, -1.8, 11, 0.4, 0xa855f7);
    this.createVerticalRiser(0, -2.0, -56, 0.6, 0xfbbf24);
  }

  // Vertical shaft riser from underground depth up to surface
  private createVerticalRiser(x: number, yBottom: number, z: number, yTop: number, color: number) {
    const height = yTop - yBottom;
    const riserGeo = new THREE.CylinderGeometry(0.1, 0.1, height, 8);
    const riserMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: color,
      emissiveIntensity: 0.4,
    });
    const riser = new THREE.Mesh(riserGeo, riserMat);
    riser.position.set(x, (yBottom + yTop) / 2, z);
    this.scene.add(riser);
    this.undergroundConduitMaterials.push(riserMat);
  }

  // Decorative trees, light poles, urban street furniture on sidewalks
  private buildTreesAndProps() {
    const treePositions: [number, number][] = [
      [-7, -30],
      [7, -30],
      [-9, -15],
      [9, -15],
      [-9, 15],
      [9, 15],
      [-23, -4],
      [23, -4],
      [-23, 4],
      [23, 4],
      [-16, -21],
      [16, -21],
      [-16, 21],
      [16, 21],
    ];

    treePositions.forEach(([x, z]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0.15, z);

      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.25, 1.4, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.7;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const folGeo = new THREE.ConeGeometry(1.2, 2.5, 8);
      const folMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8 });
      const foliage = new THREE.Mesh(folGeo, folMat);
      foliage.position.y = 2.4;
      foliage.castShadow = true;
      treeGroup.add(foliage);
      this.surfaceMeshes.push(trunk, foliage);

      this.scene.add(treeGroup);
    });

    const lampPositions: [number, number][] = [
      [-3.5, -18],
      [3.5, -18],
      [-3.5, -6],
      [3.5, -6],
      [-3.5, 6],
      [3.5, 6],
      [-3.5, 18],
      [3.5, 18],
      [-18, -3.5],
      [18, -3.5],
      [-18, 3.5],
      [18, 3.5],
    ];

    lampPositions.forEach(([x, z]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 })
      );
      pole.position.set(x, 2, z);
      pole.castShadow = true;
      this.scene.add(pole);
      this.surfaceMeshes.push(pole);

      const lampHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      lampHead.position.set(x, 4.0, z);
      this.scene.add(lampHead);
      this.surfaceMeshes.push(lampHead);
    });
  }

  // Autonomous electric city shuttles
  private buildVehicles() {
    const route1 = [
      new THREE.Vector3(1.5, 0.35, -20),
      new THREE.Vector3(1.5, 0.35, 20),
      new THREE.Vector3(-1.5, 0.35, 20),
      new THREE.Vector3(-1.5, 0.35, -20),
    ];

    const route2 = [
      new THREE.Vector3(-30, 0.35, 1.5),
      new THREE.Vector3(30, 0.35, 1.5),
      new THREE.Vector3(30, 0.35, -1.5),
      new THREE.Vector3(-30, 0.35, -1.5),
    ];

    const makeVehicle = (color: number) => {
      const vGroup = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.65, 2.2),
        new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.8 })
      );
      body.castShadow = true;
      vGroup.add(body);

      const light1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      light1.position.set(-0.4, 0.1, 1.12);
      const light2 = light1.clone();
      light2.position.set(0.4, 0.1, 1.12);
      vGroup.add(light1);
      vGroup.add(light2);

      const tail1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      tail1.position.set(-0.4, 0.1, -1.12);
      const tail2 = tail1.clone();
      tail2.position.set(0.4, 0.1, -1.12);
      vGroup.add(tail1);
      vGroup.add(tail2);

      return vGroup;
    };

    const v1 = makeVehicle(0x38bdf8);
    this.scene.add(v1);
    this.vehicles.push({ mesh: v1, path: route1, progress: 0.1, speed: 0.0035 });

    const v2 = makeVehicle(0x10b981);
    this.scene.add(v2);
    this.vehicles.push({ mesh: v2, path: route1, progress: 0.6, speed: 0.0038 });

    const v3 = makeVehicle(0xa855f7);
    this.scene.add(v3);
    this.vehicles.push({ mesh: v3, path: route2, progress: 0.35, speed: 0.0032 });
  }

  // Update dynamic environment
  public updateEnvironment(env: EnvironmentState) {
    const sunAngle = ((env.timeHours - 6) / 12) * Math.PI;
    const isDay = env.isDaytime;

    if (isDay) {
      const sunHeight = Math.sin(sunAngle) * 60 + 10;
      const sunX = Math.cos(sunAngle) * 55;
      this.dirLight.position.set(sunX, Math.max(15, sunHeight), 32);

      this.dirLight.intensity = Math.max(1.8, Math.sin(sunAngle) * 3.4);
      this.ambientLight.intensity = 1.35;
      this.hemisphereLight.intensity = 1.15;

      let daySkyHex = 0x38bdf8;
      let dayFogHex = 0xbae6fd;

      if (env.timeHours < 8.0 || env.timeHours > 16.5) {
        daySkyHex = 0xf59e0b;
        dayFogHex = 0xfde68a;
        this.dirLight.color.setHex(0xffedd5);
      } else {
        this.dirLight.color.setHex(0xfff8ee);
      }

      const dayBg = new THREE.Color(daySkyHex);
      this.scene.background = dayBg;
      (this.scene.fog as THREE.FogExp2).color.setHex(dayFogHex);
      (this.scene.fog as THREE.FogExp2).density = 0.0055;
    } else {
      this.dirLight.position.set(15, 30, 25);
      this.dirLight.intensity = 0.25;
      this.ambientLight.intensity = 0.45;
      this.hemisphereLight.intensity = 0.35;

      const nightBg = new THREE.Color(0x060913);
      this.scene.background = nightBg;
      (this.scene.fog as THREE.FogExp2).color = nightBg;
      (this.scene.fog as THREE.FogExp2).density = 0.013;
    }
  }

  // Update particle speeds based on power flow
  public updatePowerFlows(buildingPowers: Record<BuildingId, number>) {
    this.powerParticles.forEach((p, idx) => {
      p.speed = 0.09 + (idx % 2 === 0 ? 0.04 : 0.07);
    });
  }

  // Highlight building selection
  public setSelectedBuilding(buildingId: BuildingId | null) {
    this.selectedBuildingId = buildingId;

    this.buildingMeshMap.forEach((group, id) => {
      const ring = group.getObjectByName('selectionRing') as THREE.Mesh;
      if (ring) {
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = id === buildingId ? 0.9 : 0;
      }
    });

    if (buildingId) {
      const bData = this.buildingDataMap.get(buildingId);
      if (bData) {
        const [bx, by, bz] = bData.position3D;
        const bHeight = bData.dimensions3D[1];
        this.targetCameraPos.set(bx + 14, bHeight * 0.75 + 10, bz + 18);
        this.targetLookAt.set(bx, bHeight * 0.4, bz);
        this.isCameraTransitioning = true;
      }
    }
  }

  // Reset to full city overview camera (elevated perspective)
  public resetCameraOverview() {
    this.targetCameraPos.set(0, 52, 60);
    this.targetLookAt.set(0, 2, -10);
    this.isCameraTransitioning = true;
    this.setSelectedBuilding(null);
  }

  // Focus camera directly onto the Regional Feeder Substation
  public focusFeederSubstation() {
    this.targetCameraPos.set(0, 20, -32);
    this.targetLookAt.set(0, 2, -56);
    this.isCameraTransitioning = true;
    this.setSelectedBuilding(null);
  }

  // Event handling (Raycasting & Pointer)
  private bindEvents() {
    const el = this.renderer.domElement;

    const onPointerMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes: THREE.Object3D[] = [];
      this.buildingMeshMap.forEach((group) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) meshes.push(child);
        });
      });

      if (this.feederSubstationGroup) {
        this.feederSubstationGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) meshes.push(child);
        });
      }

      const intersects = this.raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        let isFeeder = false;
        while (parent) {
          if (parent.userData?.isFeederSubstation) {
            isFeeder = true;
            break;
          }
          if (parent.userData?.buildingId) {
            break;
          }
          parent = parent.parent;
        }

        if (isFeeder) {
          this.isHoveringFeeder = true;
          this.hoveredBuildingId = null;
          el.style.cursor = 'pointer';
          this.callbacks.onBuildingHover(null);
          return;
        }

        this.isHoveringFeeder = false;
        const bId = parent?.userData?.buildingId as BuildingId | undefined;
        if (bId && bId !== this.hoveredBuildingId) {
          this.hoveredBuildingId = bId;
          el.style.cursor = 'pointer';
          this.callbacks.onBuildingHover(bId, { x: e.clientX, y: e.clientY });
        }
      } else {
        this.isHoveringFeeder = false;
        if (this.hoveredBuildingId !== null) {
          this.hoveredBuildingId = null;
          el.style.cursor = 'default';
          this.callbacks.onBuildingHover(null);
        } else {
          el.style.cursor = 'default';
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      if (this.isHoveringFeeder) {
        this.focusFeederSubstation();
        this.callbacks.onFeederSubstationSelect?.();
        return;
      }
      if (this.hoveredBuildingId) {
        this.callbacks.onBuildingSelect(this.hoveredBuildingId);
      }
    };

    el.addEventListener('mousemove', onPointerMove);
    el.addEventListener('click', onClick);

    el.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
      }
    });

    el.addEventListener('webglcontextrestored', () => {
      this.animate();
    });

    const onResize = () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w > 0 && h > 0) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', onResize);
  }

  // Animation Loop
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (this.isCameraTransitioning) {
      this.camera.position.lerp(this.targetCameraPos, 0.05);
      this.currentLookAt.lerp(this.targetLookAt, 0.05);
      this.controls.target.copy(this.currentLookAt);

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.2) {
        this.isCameraTransitioning = false;
      }
    }

    this.controls.update();

    // Animate underground power particles
    this.powerParticles.forEach((p) => {
      const posAttr = p.points.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const count = p.progressArray.length;

      for (let i = 0; i < count; i++) {
        p.progressArray[i] = (p.progressArray[i] + p.speed * 0.016) % 1.0;
        const pt = p.curve.getPoint(p.progressArray[i]);
        arr[i * 3] = pt.x;
        arr[i * 3 + 1] = pt.y;
        arr[i * 3 + 2] = pt.z;
      }
      posAttr.needsUpdate = true;
    });

    // Animate autonomous shuttles along road path
    this.vehicles.forEach((v) => {
      v.progress = (v.progress + v.speed) % 1.0;
      const numPts = v.path.length;
      const segment = v.progress * numPts;
      const idx1 = Math.floor(segment) % numPts;
      const idx2 = (idx1 + 1) % numPts;
      const frac = segment - Math.floor(segment);

      const p1 = v.path[idx1];
      const p2 = v.path[idx2];
      v.mesh.position.lerpVectors(p1, p2, frac);
      v.mesh.lookAt(p2.x, v.mesh.position.y, p2.z);
    });

    // Grid node torus rotation
    this.gridNodeMeshes.forEach((g, i) => {
      const torus = g.children.find((c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.TorusGeometry);
      if (torus) {
        torus.rotation.z += (i === 0 ? 1 : -1) * 0.01;
      }
    });

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.controls.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
