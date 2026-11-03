export interface Locomotive {
  locoId: string;
  railLine: number;
  orientation: 'H' | 'V';
  x: number;
  y: number;
  status: 'Available' | 'Not Available';
  destination: string;
  destId: string;
}
