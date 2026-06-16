import type { RoverName } from '@/types/nasa';
import { formatSol, solToEarthDate } from './solConverter';
import { getCameraLabel, getRoverManifest } from './roverCameras';

export function formatEarthDateLong(earthDate: string): string {
  if (!earthDate) return 'Data indisponível';
  return new Date(`${earthDate}T12:00:00Z`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatEarthDateShort(earthDate: string): string {
  if (!earthDate) return '—';
  return new Date(`${earthDate}T12:00:00Z`).toLocaleDateString('pt-BR');
}

export interface SolExplanation {
  solLabel: string;
  earthDate: string;
  earthDateLong: string;
  headline: string;
  explanation: string;
}

/** Explica Sol marciano em linguagem acessível, usando a data da API quando existir. */
export function explainSol(
  sol: number,
  rover: RoverName,
  earthDateFromApi?: string,
): SolExplanation {
  const earthDate = earthDateFromApi?.trim() || solToEarthDate(sol, rover);
  const earthDateLong = formatEarthDateLong(earthDate);
  const roverLabel = getRoverManifest(rover).label;
  const solLabel = formatSol(sol);

  return {
    solLabel,
    earthDate,
    earthDateLong,
    headline: `${solLabel} ≈ ${formatEarthDateShort(earthDate)}`,
    explanation: `Um Sol é um dia em Marte (cerca de 24h39min). Esta foto foi registrada no ${solLabel} da missão ${roverLabel}, o que equivale a ${earthDateLong} no calendário da Terra.`,
  };
}

export function explainCamera(rover: RoverName, cameraName: string): {
  name: string;
  friendly: string;
} {
  const friendly = getCameraLabel(rover, cameraName);
  return {
    name: cameraName,
    friendly: friendly === cameraName ? 'Câmera do rover' : friendly,
  };
}

export function explainRoverStatus(status: string): { label: string; detail: string } {
  const normalized = status.toLowerCase();
  if (normalized === 'active') {
    return {
      label: 'Em operação',
      detail: 'O rover ainda estava ativo quando esta foto foi enviada.',
    };
  }
  return {
    label: 'Missão encerrada',
    detail: 'O rover já havia concluído ou interrompido suas atividades.',
  };
}

export function explainFrameId(_id: number): string {
  return `Código único desta imagem no arquivo da NASA — como um “número de série” da foto.`;
}
