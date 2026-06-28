-- Drop authenticated-only policies and replace with public (anon) access for local app
DROP POLICY IF EXISTS "select_vehicles" ON vehicles;
DROP POLICY IF EXISTS "insert_vehicles" ON vehicles;
DROP POLICY IF EXISTS "update_vehicles" ON vehicles;
DROP POLICY IF EXISTS "delete_vehicles" ON vehicles;
DROP POLICY IF EXISTS "select_inspections" ON inspections;
DROP POLICY IF EXISTS "insert_inspections" ON inspections;
DROP POLICY IF EXISTS "update_inspections" ON inspections;
DROP POLICY IF EXISTS "delete_inspections" ON inspections;
DROP POLICY IF EXISTS "select_inspection_items" ON inspection_items;
DROP POLICY IF EXISTS "insert_inspection_items" ON inspection_items;
DROP POLICY IF EXISTS "update_inspection_items" ON inspection_items;
DROP POLICY IF EXISTS "delete_inspection_items" ON inspection_items;
DROP POLICY IF EXISTS "select_services" ON services_performed;
DROP POLICY IF EXISTS "insert_services" ON services_performed;
DROP POLICY IF EXISTS "update_services" ON services_performed;
DROP POLICY IF EXISTS "delete_services" ON services_performed;

-- Public policies (anon role) for local lubrication center app
CREATE POLICY "select_vehicles" ON vehicles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_vehicles" ON vehicles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_vehicles" ON vehicles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_vehicles" ON vehicles FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "select_inspections" ON inspections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_inspections" ON inspections FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_inspections" ON inspections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_inspections" ON inspections FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "select_inspection_items" ON inspection_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_inspection_items" ON inspection_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_inspection_items" ON inspection_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_inspection_items" ON inspection_items FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "select_services" ON services_performed FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_services" ON services_performed FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_services" ON services_performed FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_services" ON services_performed FOR DELETE TO anon, authenticated USING (true);
