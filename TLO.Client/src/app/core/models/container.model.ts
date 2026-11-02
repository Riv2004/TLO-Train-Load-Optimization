export interface Container {
  containerId: string;
  sizeFt: 20 | 40;
  weight: number;
  x: number;
  y: number;
  yardTier: number;
  zoneId: string;
  priority: 'Critical' | 'High' | 'Normal';
  status: 'Available' | 'ASSIGNED';
  destId: string;
}
