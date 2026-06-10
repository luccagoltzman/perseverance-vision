import type { RoverManifest, RoverName } from '@/types/nasa';

export const ROVER_MANIFESTS: Record<RoverName, RoverManifest> = {
  perseverance: {
    name: 'perseverance',
    label: 'Perseverance',
    landingDate: '2021-02-18',
    landingSol: 0,
    status: 'active',
    cameras: [
      { id: 'EDL_RUCAM', name: 'EDL_RUCAM', fullName: 'Rover Up-Look Camera' },
      { id: 'EDL_RDCAM', name: 'EDL_RDCAM', fullName: 'Rover Down-Look Camera' },
      { id: 'EDL_DDCAM', name: 'EDL_DDCAM', fullName: 'Descent Stage Down-Look Camera' },
      { id: 'EDL_PUCAM', name: 'EDL_PUCAM', fullName: 'Parachute Up-Look Camera A' },
      { id: 'FRONT_HAZCAM_A', name: 'FRONT_HAZCAM_A', fullName: 'Front Hazard Avoidance Camera A' },
      { id: 'FRONT_HAZCAM_B', name: 'FRONT_HAZCAM_B', fullName: 'Front Hazard Avoidance Camera B' },
      { id: 'REAR_HAZCAM_A', name: 'REAR_HAZCAM_A', fullName: 'Rear Hazard Avoidance Camera A' },
      { id: 'REAR_HAZCAM_B', name: 'REAR_HAZCAM_B', fullName: 'Rear Hazard Avoidance Camera B' },
      { id: 'NAVCAM_LEFT', name: 'NAVCAM_LEFT', fullName: 'Navigation Camera - Left' },
      { id: 'NAVCAM_RIGHT', name: 'NAVCAM_RIGHT', fullName: 'Navigation Camera - Right' },
      { id: 'MCZ_LEFT', name: 'MCZ_LEFT', fullName: 'Mast Camera Zoom - Left' },
      { id: 'MCZ_RIGHT', name: 'MCZ_RIGHT', fullName: 'Mast Camera Zoom - Right' },
      { id: 'SKYCAM', name: 'SKYCAM', fullName: 'MEDA Skycam' },
      { id: 'SUPERCAM_RMI', name: 'SUPERCAM_RMI', fullName: 'SuperCam Remote Micro Imager' },
      { id: 'LCAM', name: 'LCAM', fullName: 'Lander Vision System Camera' },
    ],
  },
  curiosity: {
    name: 'curiosity',
    label: 'Curiosity',
    landingDate: '2012-08-06',
    landingSol: 0,
    status: 'active',
    cameras: [
      { id: 'FHAZ', name: 'FHAZ', fullName: 'Front Hazard Avoidance Camera' },
      { id: 'RHAZ', name: 'RHAZ', fullName: 'Rear Hazard Avoidance Camera' },
      { id: 'MAST', name: 'MAST', fullName: 'Mast Camera' },
      { id: 'CHEMCAM', name: 'CHEMCAM', fullName: 'Chemistry and Camera Complex' },
      { id: 'MAHLI', name: 'MAHLI', fullName: 'Mars Hand Lens Imager' },
      { id: 'MARDI', name: 'MARDI', fullName: 'Mars Descent Imager' },
      { id: 'NAVCAM', name: 'NAVCAM', fullName: 'Navigation Camera' },
    ],
  },
  opportunity: {
    name: 'opportunity',
    label: 'Opportunity',
    landingDate: '2004-01-25',
    landingSol: 0,
    status: 'completed',
    cameras: [
      { id: 'FHAZ', name: 'FHAZ', fullName: 'Front Hazard Avoidance Camera' },
      { id: 'RHAZ', name: 'RHAZ', fullName: 'Rear Hazard Avoidance Camera' },
      { id: 'NAVCAM', name: 'NAVCAM', fullName: 'Navigation Camera' },
      { id: 'PANCAM', name: 'PANCAM', fullName: 'Panoramic Camera' },
      { id: 'MINITES', name: 'MINITES', fullName: 'Miniature Thermal Emission Spectrometer' },
    ],
  },
  spirit: {
    name: 'spirit',
    label: 'Spirit',
    landingDate: '2004-01-04',
    landingSol: 0,
    status: 'completed',
    cameras: [
      { id: 'FHAZ', name: 'FHAZ', fullName: 'Front Hazard Avoidance Camera' },
      { id: 'RHAZ', name: 'RHAZ', fullName: 'Rear Hazard Avoidance Camera' },
      { id: 'NAVCAM', name: 'NAVCAM', fullName: 'Navigation Camera' },
      { id: 'PANCAM', name: 'PANCAM', fullName: 'Panoramic Camera' },
      { id: 'MINITES', name: 'MINITES', fullName: 'Miniature Thermal Emission Spectrometer' },
    ],
  },
};

export const ROVER_LIST = Object.values(ROVER_MANIFESTS);

export function getRoverManifest(name: RoverName): RoverManifest {
  return ROVER_MANIFESTS[name];
}

export function getCameraLabel(rover: RoverName, cameraName: string): string {
  const manifest = ROVER_MANIFESTS[rover];
  const camera = manifest.cameras.find(
    (c) => c.name === cameraName || c.id === cameraName,
  );
  return camera?.fullName ?? cameraName;
}
