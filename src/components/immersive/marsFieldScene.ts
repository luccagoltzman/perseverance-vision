import * as THREE from 'three';
import { windToAnimationParams } from '@/utils/windPhysics';
import type { MarsFieldMultiplayerClient } from '@/services/marsFieldMultiplayer';
import { RemotePlayersManager } from './marsFieldRemotePlayers';
import { FieldInputController } from './marsFieldInput';
import {
  animateAvatarWalk,
  animateAvatarWave,
  createMarsExplorerAvatar,
  getWalkBob,
} from './marsFieldAvatar';
import { createNameplate, mountNameplate } from './marsFieldNameplate';
import { createLaserRifle, LaserBeamManager } from './marsFieldLaser';
import { animateRoverDrive, animateRoverWave } from './marsFieldRover';
import {
  startBoardTransition,
  startExitTransition,
  updateBoardingTransition,
  type BoardingTransition,
} from './marsFieldBoarding';
import {
  createParkedRovers,
  disposeParkedRovers,
  findNearestParkedRover,
  type ParkedRoverEntry,
  type VehicleMode,
} from './marsFieldVehicle';
import { createMarsRocks } from './marsFieldRocks';
import { createVegetationSystem, updateVegetation } from './marsFieldVegetation';
import { createMarsWindAudio } from './marsWindAudio';

export interface MarsFieldSceneOptions {
  container: HTMLElement;
  windSpeed: number;
  windDirection: string;
  reducedMotion: boolean;
  input: FieldInputController;
  playerName?: string;
  multiplayer?: MarsFieldMultiplayerClient;
  onPhotoCapture?: (dataUrl: string) => void;
  onInteractionHint?: (hint: string | null) => void;
}

const SKY_VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition).y;
    vec3 zenith = vec3(0.72, 0.58, 0.48);
    vec3 mid = vec3(0.86, 0.55, 0.38);
    vec3 horizon = vec3(0.62, 0.32, 0.22);
    vec3 color = mix(horizon, mid, smoothstep(-0.05, 0.25, h));
    color = mix(color, zenith, smoothstep(0.2, 0.85, h));
    gl_FragColor = vec4(color, 1.0);
  }
`;

const FIELD_LIMIT = 68;
const FOOT_WALK_SPEED = 5.5;
const FOOT_SPRINT_SPEED = 9.5;
const FOOT_TURN_SPEED = 2.4;
const ROVER_WALK_SPEED = 7;
const ROVER_SPRINT_SPEED = 11.5;
const ROVER_TURN_SPEED = 2.1;
const GRAVITY = -16;
const JUMP_FORCE = 5.2;

function clampField(value: number): number {
  return Math.max(-FIELD_LIMIT, Math.min(FIELD_LIMIT, value));
}

export function createMarsFieldScene({
  container,
  windSpeed,
  windDirection,
  reducedMotion,
  input,
  playerName = 'Explorador',
  multiplayer,
  onPhotoCapture,
  onInteractionHint,
}: MarsFieldSceneOptions): () => void {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x8b4a32);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xc47850, 0.018);

  const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 500);
  const cameraTarget = new THREE.Vector3();

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 48, 24),
    new THREE.ShaderMaterial({
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  scene.add(sky);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe8d0 }),
  );
  sun.position.set(38, 22, -80);
  scene.add(sun);

  scene.add(new THREE.AmbientLight(0xc48868, 0.55));
  const sunLight = new THREE.DirectionalLight(0xffc8a0, 0.85);
  sunLight.position.set(30, 40, -20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.camera.left = -40;
  sunLight.shadow.camera.right = 40;
  sunLight.shadow.camera.top = 40;
  sunLight.shadow.camera.bottom = -40;
  scene.add(sunLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x8f3d28,
      roughness: 0.95,
      metalness: 0.02,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 40),
    new THREE.MeshBasicMaterial({
      color: 0xd48460,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  haze.position.set(0, 6, -55);
  scene.add(haze);

  const rocks = createMarsRocks();
  scene.add(rocks.group);

  const vegetation = createVegetationSystem();
  for (const layer of vegetation.layers) scene.add(layer.mesh);

  const dummy = new THREE.Object3D();

  const dustCount = reducedMotion ? 0 : 400;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustVelocities: THREE.Vector3[] = [];

  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 70;
    dustPositions[i * 3 + 1] = Math.random() * 12 + 0.5;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 70 - 15;
    dustVelocities.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.008,
        (Math.random() - 0.5) * 0.02,
      ),
    );
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xffa878,
      size: 0.12,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  scene.add(dust);

  const avatar = createMarsExplorerAvatar({ accent: 0xf94a1a });
  avatar.root.position.set(0, 0, 8);
  avatar.root.rotation.y = Math.PI;
  const localNameplate = createNameplate(playerName, 'local');
  mountNameplate(localNameplate, avatar.root);
  const localLaser = createLaserRifle();
  localLaser.visible = false;
  avatar.root.add(localLaser);
  scene.add(avatar.root);

  const laserBeams = new LaserBeamManager(scene);

  const parkedRovers = createParkedRovers(scene);
  let activeRover: ParkedRoverEntry | null = null;
  let transition: BoardingTransition | null = null;

  const flashOverlay = document.createElement('div');
  flashOverlay.style.cssText =
    'position:absolute;inset:0;background:white;opacity:0;pointer-events:none;transition:opacity 0.08s ease-out;z-index:5';
  container.appendChild(flashOverlay);

  let remotePlayers: RemotePlayersManager | null = new RemotePlayersManager(scene, container);
  let removeMpCallbacks: (() => void) | null = null;
  const resetLocalPlayer = (x: number, z: number, y: number, yaw: number) => {
    avatar.root.position.set(x, y, z);
    avatar.root.rotation.y = yaw;
    playerYaw = yaw;
    avatarY = y;
    verticalVelocity = 0;
    mode = 'foot';
    activeRover = null;
    transition = null;
    avatar.root.visible = true;
    localLaser.visible = false;
    mountNameplate(localNameplate, avatar.root);
  };

  if (multiplayer) {
    removeMpCallbacks = multiplayer.addCallbacks({
      onWelcome: (id, players) => {
        remotePlayers!.syncFromWelcome(players.filter((p) => p.id !== id));
      },
      onPlayerJoined: (player) => {
        if (player.id !== multiplayer.id) remotePlayers!.upsert(player, player.name);
      },
      onPlayerLeft: (id) => remotePlayers!.remove(id),
      onPlayerState: (state) => {
        if (state.id !== multiplayer.id) {
          remotePlayers!.upsert(state, state.name || 'Explorador');
        }
      },
      onLaserShot: (_id, x, z, y, yaw) => {
        laserBeams.spawn(x, y, z, yaw);
      },
      onLocalRespawn: (player) => {
        resetLocalPlayer(player.x, player.z, player.y, player.yaw);
      },
      onPlayerRespawned: (player) => {
        if (player.id !== multiplayer.id) remotePlayers!.upsert(player, player.name);
      },
    });
  }

  let mode: VehicleMode = 'foot';
  let playerYaw = Math.PI;
  let avatarY = 0;
  let verticalVelocity = 0;
  let walkPhase = 0;
  let drivePhase = 0;
  let localWaveUntil = 0;
  let time = 0;
  let frame = 0;
  let lastFrameTime = performance.now();

  input.attach();

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const combat = multiplayer?.combatState;
    if (!combat?.alive || !combat.laserEquipped || mode === 'rover' || transition) return;
    input.queueShoot();
  };
  container.addEventListener('pointerdown', onPointerDown);

  const stopWindAudio = reducedMotion ? () => {} : createMarsWindAudio(windSpeed);

  container.tabIndex = 0;
  container.style.outline = 'none';
  container.focus({ preventScroll: true });

  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    remotePlayers?.resize();
  };

  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const animate = () => {
    frame = requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    const p = windToAnimationParams(windSpeed, windDirection);
    const windX = Math.cos(p.leanRadians);
    const windZ = Math.sin(p.leanRadians);
    const bendScale = 0.0032;

    if (!reducedMotion) time += delta;

    const raw = input.snapshot();
    const combat = multiplayer?.combatState;
    const alive = combat?.alive ?? true;
    input.setCombatLocked(!alive);

    const inputLocked = mode === 'boarding' || mode === 'exiting' || !alive;
    const forward = inputLocked ? 0 : raw.forward;
    const turn = inputLocked ? 0 : raw.turn;
    const sprint = inputLocked ? false : raw.sprint;
    const jump = inputLocked ? false : raw.jump;
    const wave = inputLocked ? false : raw.wave;
    const photo = inputLocked ? false : raw.photo;
    const interact = inputLocked ? false : raw.interact;
    const shoot = inputLocked ? false : raw.shoot;

    localLaser.visible = Boolean(
      combat?.laserEquipped && alive && mode === 'foot' && !transition,
    );

    if (shoot && combat?.laserEquipped && alive && mode === 'foot' && !transition) {
      multiplayer?.shoot();
    }

    const nearestRover =
      mode === 'foot' && !transition
        ? findNearestParkedRover(
            parkedRovers,
            avatar.root.position.x,
            avatar.root.position.z,
            null,
          )
        : null;

    for (const entry of parkedRovers) {
      entry.interactHint.visible = nearestRover?.id === entry.id;
    }

    if (interact) {
      if (mode === 'foot' && nearestRover) {
        transition = startBoardTransition(nearestRover, avatar);
        mode = 'boarding';
      } else if (mode === 'rover' && activeRover) {
        transition = startExitTransition(activeRover, playerYaw);
        mode = 'exiting';
        avatar.root.visible = true;
        avatar.root.position.copy(transition.from);
        mountNameplate(localNameplate, avatar.root);
      }
    }

    onInteractionHint?.(
      mode === 'foot' && nearestRover
        ? `F — Entrar no ${nearestRover.label}`
        : mode === 'rover'
          ? 'F — Sair do rover'
          : mode === 'boarding'
            ? 'Embarcando…'
            : mode === 'exiting'
              ? 'Desembarcando…'
              : null,
    );

    let isMoving = forward !== 0;
    let posX = avatar.root.position.x;
    let posZ = avatar.root.position.z;
    let posY = avatarY;

    if (transition) {
      avatar.root.visible = true;
      const result = updateBoardingTransition(transition, avatar, delta, walkPhase);
      walkPhase = result.walkPhase;
      isMoving = true;

      if (result.done) {
        if (transition.kind === 'board') {
          mode = 'rover';
          activeRover = transition.rover;
          playerYaw = transition.rover.rover.root.rotation.y;
          avatar.root.visible = false;
          mountNameplate(localNameplate, activeRover.rover.root);
        } else {
          mode = 'foot';
          avatar.root.position.set(
            clampField(transition.to.x),
            avatarY,
            clampField(transition.to.z),
          );
          avatar.root.visible = true;
          mountNameplate(localNameplate, avatar.root);
          activeRover = null;
        }
        transition = null;
      }

      posX = avatar.root.position.x;
      posZ = avatar.root.position.z;
    } else if (mode === 'foot') {
      playerYaw += turn * FOOT_TURN_SPEED * delta;
      const speed = sprint ? FOOT_SPRINT_SPEED : FOOT_WALK_SPEED;
      const moveX = Math.sin(playerYaw) * forward * speed * delta;
      const moveZ = Math.cos(playerYaw) * forward * speed * delta;

      avatar.root.rotation.y = playerYaw;
      avatar.root.position.x = clampField(avatar.root.position.x + moveX);
      avatar.root.position.z = clampField(avatar.root.position.z + moveZ);

      if (jump && avatarY <= 0.01) verticalVelocity = JUMP_FORCE;
      verticalVelocity += GRAVITY * delta;
      avatarY += verticalVelocity * delta;
      if (avatarY < 0) {
        avatarY = 0;
        verticalVelocity = 0;
      }

      const airborne = avatarY > 0.05;
      if (isMoving && !airborne) walkPhase += delta * (sprint ? 13 : 9);

      if (wave) {
        localWaveUntil = Date.now() + 1800;
        multiplayer?.wave();
      }
      const localWaving = Date.now() < localWaveUntil;
      animateAvatarWalk(avatar, isMoving, walkPhase, { sprint, airborne });
      if (localWaving) animateAvatarWave(avatar, true);
      const bob = airborne ? 0 : getWalkBob(isMoving, walkPhase, sprint);
      avatar.root.position.y = avatarY + bob;

      posX = avatar.root.position.x;
      posZ = avatar.root.position.z;
      posY = avatarY;
    } else if (mode === 'rover' && activeRover) {
      const rover = activeRover.rover;
      const turnSpeed = ROVER_TURN_SPEED;
      const sprintSpeed = ROVER_SPRINT_SPEED;
      const walkSpeed = ROVER_WALK_SPEED;

      playerYaw += turn * turnSpeed * delta;

      const speed = sprint ? sprintSpeed : walkSpeed;
      const moveX = Math.sin(playerYaw) * forward * speed * delta;
      const moveZ = Math.cos(playerYaw) * forward * speed * delta;

      rover.root.rotation.y = playerYaw;
      rover.root.position.x = clampField(rover.root.position.x + moveX);
      rover.root.position.z = clampField(rover.root.position.z + moveZ);

      if (isMoving) drivePhase += delta * (sprint ? 14 : 9);
      if (wave) {
        localWaveUntil = Date.now() + 1800;
        multiplayer?.wave();
      }
      const localWaving = Date.now() < localWaveUntil;
      const driveBob = animateRoverDrive(rover, isMoving, sprint, drivePhase);
      if (localWaving) animateRoverWave(rover);
      rover.root.position.y = driveBob;

      posX = rover.root.position.x;
      posZ = rover.root.position.z;
      posY = 0;
    }

    if (photo && onPhotoCapture) {
      flashOverlay.style.opacity = '0.85';
      window.setTimeout(() => {
        flashOverlay.style.opacity = '0';
      }, 80);
      renderer.render(scene, camera);
      remotePlayers?.update(0, camera);
      onPhotoCapture(renderer.domElement.toDataURL('image/png'));
    }

    const camDistance =
      mode === 'rover'
        ? sprint
          ? 8.5
          : 7.2
        : sprint
          ? 6
          : 5.2;
    const camHeight = mode === 'rover' ? 3.4 : 2.1 + posY * 0.35;
    const lookAhead = mode === 'rover' ? 4.5 : 3.5;
    const lookHeight = mode === 'rover' ? 1.1 : 1.25 + posY * 0.25;
    const targetCamX = posX - Math.sin(playerYaw) * camDistance;
    const targetCamZ = posZ - Math.cos(playerYaw) * camDistance;

    camera.position.lerp(
      new THREE.Vector3(targetCamX, camHeight, targetCamZ),
      1 - Math.pow(0.001, delta),
    );

    cameraTarget.set(
      posX + Math.sin(playerYaw) * lookAhead,
      lookHeight,
      posZ + Math.cos(playerYaw) * lookAhead,
    );
    camera.lookAt(cameraTarget);

    updateVegetation(
      vegetation.layers,
      dummy,
      time,
      windX,
      windZ,
      bendScale,
      p,
      reducedMotion,
    );

    if (!reducedMotion && dustCount > 0) {
      const positions = dustGeo.attributes.position as THREE.BufferAttribute;
      const drift = p.particleSpeed * 0.08;
      const dx = windX * drift;
      const dz = windZ * drift;

      for (let i = 0; i < dustCount; i++) {
        let x = positions.getX(i) + dx * dustVelocities[i].x * 40;
        let y = positions.getY(i) + dustVelocities[i].y;
        let z = positions.getZ(i) + dz * dustVelocities[i].z * 40;

        if (x > 35) x = -35;
        if (x < -35) x = 35;
        if (z > 25) z = -45;
        if (z < -45) z = 25;
        if (y > 14) y = 0.5;
        if (y < 0.3) y = 14;

        positions.setXYZ(i, x, y, z);
      }
      positions.needsUpdate = true;
    }

    multiplayer?.sendState({
      x: posX,
      z: posZ,
      y: posY,
      yaw: playerYaw,
      sprint,
      moving: isMoving,
      inRover: mode === 'rover',
    });

    remotePlayers?.update(delta, camera);
    laserBeams.update();
    renderer.render(scene, camera);
  };

  animate();

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    removeMpCallbacks?.();
    remotePlayers?.dispose();
    input.detach();
    container.removeEventListener('pointerdown', onPointerDown);
    onInteractionHint?.(null);
    stopWindAudio();
    flashOverlay.remove();
    laserBeams.dispose();
    avatar.dispose();
    disposeParkedRovers(parkedRovers);
    vegetation.dispose();
    rocks.dispose();
    renderer.dispose();
    dustGeo.dispose();
    (dust.material as THREE.Material).dispose();
    (ground.material as THREE.Material).dispose();
    (sky.material as THREE.Material).dispose();
    (sun.material as THREE.Material).dispose();
    (haze.material as THREE.Material).dispose();
    container.removeChild(renderer.domElement);
  };
}
