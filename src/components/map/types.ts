import type { TrackPoint } from "@/types/trako";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  onClick?: () => void;
}

/**
 * Contrato único de mapa do TRAKO.
 * Todo provedor (MapKit no iOS, MapLibre/OSM nas demais plataformas)
 * implementa exatamente esta interface — as telas nunca sabem qual está ativo.
 */
export interface MapViewProps {
  /** posição real do dispositivo (nunca fixa/hardcoded) */
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  /** percurso principal, desenhado em tempo real durante a gravação */
  track?: TrackPoint[];
  /** percursos secundários (comunidade) */
  tracks?: { id: string; points: TrackPoint[] }[];
  /** pontos de interesse */
  markers?: MapMarker[];
  follow?: boolean;
  fitTrack?: boolean;
  interactive?: boolean;
  showUser?: boolean;
  className?: string;
}
