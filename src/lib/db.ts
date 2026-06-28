import { supabase } from './supabase';
import type { Vehicle, Inspection, InspectionItem, ServicePerformed } from '../types';

export async function saveVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  const { data: existing } = await supabase
    .from('vehicles')
    .select('id')
    .eq('patente', vehicle.patente)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...vehicle, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNextCertificateNumber(): Promise<number> {
  const { data, error } = await supabase
    .from('inspections')
    .select('certificate_number')
    .order('certificate_number', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 1;
  return data[0].certificate_number + 1;
}

export async function saveInspection(
  vehicle: Omit<Vehicle, 'id'>,
  inspection: Partial<Omit<Inspection, 'id' | 'vehicle_id' | 'certificate_number'>> & { entry_date: string; technician_name: string; },
  items: Omit<InspectionItem, 'id' | 'inspection_id'>[],
  services: Omit<ServicePerformed, 'id' | 'inspection_id'>[]
): Promise<{ inspection: Inspection; vehicle: Vehicle }> {
  const savedVehicle = await saveVehicle(vehicle);
  const certNumber = await getNextCertificateNumber();

  const { data: inspData, error: inspError } = await supabase
    .from('inspections')
    .insert({
      ...inspection,
      mileage: inspection.mileage || null,
      general_observations: inspection.general_observations || null,
      vehicle_id: savedVehicle.id!,
      certificate_number: certNumber,
    })
    .select()
    .single();

  if (inspError) throw inspError;

  if (items.length > 0) {
    const itemsWithId = items.map((item) => ({
      ...item,
      next_service_date: item.next_service_date || null,
      photo_url: item.photo_url || null,
      observations: item.observations || null,
      recommendations: item.recommendations || null,
      inspection_id: inspData.id,
    }));
    const { error: itemsError } = await supabase.from('inspection_items').insert(itemsWithId);
    if (itemsError) throw itemsError;
  }

  if (services.length > 0) {
    const servicesWithId = services.map((svc) => ({
      ...svc,
      current_mileage: svc.current_mileage || null,
      next_mileage_recommended: svc.next_mileage_recommended || null,
      observations: svc.observations || null,
      part_code: svc.part_code || null,
      inspection_id: inspData.id,
    }));
    const { error: svcError } = await supabase.from('services_performed').insert(servicesWithId);
    if (svcError) throw svcError;
  }

  return { inspection: inspData, vehicle: savedVehicle };
}

export async function getInspections(search?: string): Promise<any[]> {
  let query = supabase
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles(*),
      items:inspection_items(*),
      services:services_performed(*)
    `)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `vehicle.patente.ilike.%${search}%,vehicle.owner_name.ilike.%${search}%,vehicle.phone.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getInspectionById(id: string): Promise<any> {
  const { data, error } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles(*),
      items:inspection_items(*),
      services:services_performed(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getDashboardStats(): Promise<any> {
  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true });

  const { count: inspectionCount } = await supabase
    .from('inspections')
    .select('*', { count: 'exact', head: true });

  const { data: recentInspections } = await supabase
    .from('inspections')
    .select(`
      id, entry_date, mileage, technician_name, created_at,
      vehicle:vehicles(patente, owner_name, brand, model)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: serviceStats } = await supabase
    .from('services_performed')
    .select('service_name')
    .order('created_at', { ascending: false })
    .limit(100);

  const serviceCounts: Record<string, number> = {};
  (serviceStats || []).forEach((s: any) => {
    serviceCounts[s.service_name] = (serviceCounts[s.service_name] || 0) + 1;
  });

  const topServices = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Filter and oil statistics - grouped by part_code
  const { data: filterOilServices } = await supabase
    .from('services_performed')
    .select(`
      service_name,
      part_code,
      created_at,
      inspection:inspections(
        vehicle:vehicles(patente, brand, model)
      )
    `)
    .in('service_name', [
      'Cambio aceite motor',
      'Cambio filtro aceite',
      'Cambio filtro aire',
      'Cambio filtro cabina',
    ])
    .order('created_at', { ascending: false })
    .limit(100);

  // Group by part_code for each service type
  const groupByPartCode = (services: any[], serviceName: string) => {
    const filtered = services?.filter((s: any) => s.service_name === serviceName) || [];
    const grouped: Record<string, { count: number; lastUsed: string; part_code: string }> = {};

    filtered.forEach((s: any) => {
      const key = s.part_code || 'Sin codigo';
      if (!grouped[key]) {
        grouped[key] = { count: 0, lastUsed: s.created_at, part_code: key };
      }
      grouped[key].count++;
      if (new Date(s.created_at) > new Date(grouped[key].lastUsed)) {
        grouped[key].lastUsed = s.created_at;
      }
    });

    return Object.values(grouped)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const filterOilStats = {
    aceiteMotor: groupByPartCode(filterOilServices, 'Cambio aceite motor'),
    filtroAceite: groupByPartCode(filterOilServices, 'Cambio filtro aceite'),
    filtroAire: groupByPartCode(filterOilServices, 'Cambio filtro aire'),
    filtroCabina: groupByPartCode(filterOilServices, 'Cambio filtro cabina'),
  };

  return {
    vehicleCount: vehicleCount || 0,
    inspectionCount: inspectionCount || 0,
    recentInspections: recentInspections || [],
    topServices,
    filterOilStats,
  };
}

export async function getAllServices(): Promise<any[]> {
  const { data, error } = await supabase
    .from('services_performed')
    .select(`
      *,
      inspection:inspections(
        id, entry_date, mileage,
        vehicle:vehicles(patente, owner_name, brand, model)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function updateInspection(
  id: string,
  inspection: Partial<Inspection>,
  items: Omit<InspectionItem, 'id' | 'inspection_id'>[],
  services: Omit<ServicePerformed, 'id' | 'inspection_id'>[]
): Promise<void> {
  const { error: inspError } = await supabase
    .from('inspections')
    .update({
      mileage: inspection.mileage,
      technician_name: inspection.technician_name,
      general_observations: inspection.general_observations,
    })
    .eq('id', id);

  if (inspError) throw inspError;

  await supabase.from('inspection_items').delete().eq('inspection_id', id);
  if (items.length > 0) {
    const itemsWithId = items.map((item) => ({ ...item, inspection_id: id }));
    const { error: itemsError } = await supabase.from('inspection_items').insert(itemsWithId);
    if (itemsError) throw itemsError;
  }

  await supabase.from('services_performed').delete().eq('inspection_id', id);
  if (services.length > 0) {
    const servicesWithId = services.map((svc) => ({ ...svc, inspection_id: id }));
    const { error: svcError } = await supabase.from('services_performed').insert(servicesWithId);
    if (svcError) throw svcError;
  }
}
