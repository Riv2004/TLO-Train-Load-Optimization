export interface Railcar {
  railCarId: string;
  type: 'A' | 'B';
  weight: number;
  status: 'Available' | 'LOADED';
  order: number | null;
  x: number | null;
  y: number | null;
  orientation: 'H' | 'V' | null;
  destId: string;
}
