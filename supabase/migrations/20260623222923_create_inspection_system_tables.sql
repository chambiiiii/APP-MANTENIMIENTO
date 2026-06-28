-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patente TEXT NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  transmission TEXT CHECK (transmission IN ('Manual', 'Automática', 'CVT')),
  observations TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inspections table
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  certificate_number INTEGER NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mileage INTEGER,
  technician_name TEXT NOT NULL DEFAULT '',
  general_observations TEXT DEFAULT '',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inspection items (checklist)
CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  item_name TEXT NOT NULL,
  condition TEXT CHECK (condition IN ('Excelente', 'Bueno', 'Regular', 'Malo', 'Requiere Cambio')),
  observations TEXT DEFAULT '',
  recommendations TEXT DEFAULT '',
  next_service_date DATE,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Services performed
CREATE TABLE services_performed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  current_mileage INTEGER,
  next_mileage_recommended INTEGER,
  observations TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence for certificate numbers
CREATE SEQUENCE certificate_number_seq START 1;

-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services_performed ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicles (public access for local app)
CREATE POLICY "select_vehicles" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_vehicles" ON vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_vehicles" ON vehicles FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_inspections" ON inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_inspections" ON inspections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_inspections" ON inspections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_inspections" ON inspections FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_inspection_items" ON inspection_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_inspection_items" ON inspection_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_inspection_items" ON inspection_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_inspection_items" ON inspection_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_services" ON services_performed FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_services" ON services_performed FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_services" ON services_performed FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_services" ON services_performed FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX idx_inspection_items_inspection_id ON inspection_items(inspection_id);
CREATE INDEX idx_services_inspection_id ON services_performed(inspection_id);
CREATE INDEX idx_vehicles_patente ON vehicles(patente);
