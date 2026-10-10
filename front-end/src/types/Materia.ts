export interface Materia {
  id: number;
  nombre: string;
  codigo: string;
  correlativas: string[];
  aprobada: Estado;
}

export type Estado = 'pendiente' | 'regular' | 'aprobada'
