import * as THREE from 'three';
import type { MarsExplorerAvatar } from './marsFieldAvatar';
import { animateAvatarWalk } from './marsFieldAvatar';
import {
  BOARD_DURATION,
  EXIT_DURATION,
  easeInOutCubic,
  exitPositionFromRover,
  lerpAngle,
  type ParkedRoverEntry,
  seatPositionFromRover,
} from './marsFieldVehicle';

export interface BoardingTransition {
  kind: 'board' | 'exit';
  rover: ParkedRoverEntry;
  progress: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  startYaw: number;
  targetYaw: number;
}

export function startBoardTransition(
  rover: ParkedRoverEntry,
  avatar: MarsExplorerAvatar,
): BoardingTransition {
  const seat = seatPositionFromRover(rover.rover.root.position.x, rover.rover.root.position.z);
  return {
    kind: 'board',
    rover,
    progress: 0,
    from: avatar.root.position.clone(),
    to: seat,
    startYaw: avatar.root.rotation.y,
    targetYaw: rover.rover.root.rotation.y,
  };
}

export function startExitTransition(
  rover: ParkedRoverEntry,
  playerYaw: number,
): BoardingTransition {
  const exit = exitPositionFromRover(
    rover.rover.root.position.x,
    rover.rover.root.position.z,
    playerYaw,
  );
  const seat = seatPositionFromRover(rover.rover.root.position.x, rover.rover.root.position.z);
  return {
    kind: 'exit',
    rover,
    progress: 0,
    from: seat,
    to: new THREE.Vector3(exit.x, 0, exit.z),
    startYaw: playerYaw,
    targetYaw: playerYaw,
  };
}

export function updateBoardingTransition(
  transition: BoardingTransition,
  avatar: MarsExplorerAvatar,
  delta: number,
  walkPhase: number,
): { done: boolean; walkPhase: number } {
  const duration = transition.kind === 'board' ? BOARD_DURATION : EXIT_DURATION;
  transition.progress += delta / duration;
  const t = easeInOutCubic(Math.min(1, transition.progress));

  avatar.root.position.lerpVectors(transition.from, transition.to, t);
  avatar.root.rotation.y = lerpAngle(transition.startYaw, transition.targetYaw, t);

  const nextPhase = walkPhase + delta * 10;
  animateAvatarWalk(avatar, true, nextPhase, { sprint: false, airborne: false });

  return { done: transition.progress >= 1, walkPhase: nextPhase };
}
