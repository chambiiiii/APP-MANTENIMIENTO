export type Condition = 'Bueno' | 'Regular' | 'Requiere Cambio';

export type Transmission = 'Manual' | 'Automática' | 'CVT';

export interface Vehicle {
  id?: string;
  patente: string;
  owner_name: string;
  phone: string;
  brand: string;
  model: string;
  year: number | null;
  transmission: Transmission | '';
  observations: string;
  created_at?: string;
  updated_at?: string;
}

export interface Inspection {
  id?: string;
  vehicle_id: string;
  certificate_number: number;
  entry_date: string;
  mileage: number | null;
  technician_name: string;
  general_observations: string;
  status: string;
  created_at?: string;
}

export interface InspectionItem {
  id?: string;
  inspection_id?: string;
  section: string;
  item_name: string;
  condition: Condition | '';
  observations: string;
  recommendations: string;
  next_service_date: string;
  photo_url: string;
}

export interface ServicePerformed {
  id?: string;
  inspection_id?: string;
  service_name: string;
  current_mileage: number | null;
  next_mileage_recommended: number | null;
  observations: string;
  part_code: string;
}

export interface InspectionWithVehicle extends Inspection {
  vehicle?: Vehicle;
  items?: InspectionItem[];
  services?: ServicePerformed[];
}

export const CONDITIONS: Condition[] = ['Bueno', 'Regular', 'Requiere Cambio'];

export const TRANSMISSIONS: Transmission[] = ['Manual', 'Automática', 'CVT'];

export const CONDITION_COLORS: Record<Condition, { bg: string; text: string; dot: string; label: string }> = {
  'Bueno': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Bueno' },
  'Regular': { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Regular' },
  'Requiere Cambio': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-600', label: 'Requiere Cambio' },
};

export const SEMAPHORE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'green': { bg: 'bg-green-500', text: 'text-white', label: 'Bueno' },
  'yellow': { bg: 'bg-yellow-500', text: 'text-white', label: 'Regular' },
  'red': { bg: 'bg-red-500', text: 'text-white', label: 'Malo' },
};

export interface ChecklistSection {
  name: string;
  items: string[];
  autoRecommendation: string;
}

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    name: 'Frenos',
    items: [
      'Nivel del líquido de frenos',
      'Calidad del líquido de frenos',
    ],
    autoRecommendation: 'Se recomienda inspección inmediata y reemplazo de componentes defectuosos para garantizar la seguridad del vehículo.',
  },
  {
    name: 'Líquidos del Vehículo',
    items: [
      'Aceite de motor',
      'Dirección hidráulica',
      'Refrigerante',
      'Fluido de transmisión',
    ],
    autoRecommendation: 'Se recomienda mantener los líquidos en niveles óptimos y respetar los intervalos de cambio definidos por el fabricante.',
  },
  {
    name: 'Filtros',
    items: [
      'Filtro de aire',
      'Filtro de aceite',
      'Filtro de combustible',
      'Filtro de cabina o polen',
    ],
    autoRecommendation: 'Los filtros saturados reducen el rendimiento del motor y aumentan el consumo de combustible.',
  },
  {
    name: 'Neumáticos',
    items: [
      'Desgaste de banda de rodadura',
    ],
    autoRecommendation: 'Se recomienda mantener la presión correcta y realizar alineación y balanceo cada 10.000 kilómetros.',
  },
  {
    name: 'Batería',
    items: [
      'Fecha de fabricación',
      'Vida útil',
      'Nivel de carga',
    ],
    autoRecommendation: 'Una batería deteriorada puede provocar fallas de arranque y daños al sistema eléctrico.',
  },
  {
    name: 'Suspensión y Dirección',
    items: [
      'Amortiguadores',
      'Bujes',
      'Soportes',
      'Barras estabilizadoras',
      'Terminales',
      'Rótulas',
    ],
    autoRecommendation: 'El desgaste de la suspensión y dirección compromete la estabilidad y aumenta las distancias de frenado.',
  },
];

export const SERVICE_TYPES = [
  'Cambio aceite motor',
  'Cambio filtro aceite',
  'Cambio filtro aire',
  'Cambio filtro combustible',
  'Cambio filtro cabina',
  'Cambio líquido frenos',
  'Cambio refrigerante',
  'Cambio aceite transmisión',
  'Rotación neumáticos',
];

export const SERVICES_WITH_PART_CODE = [
  'Cambio aceite motor',
  'Cambio filtro aceite',
  'Cambio filtro aire',
  'Cambio filtro cabina',
];
