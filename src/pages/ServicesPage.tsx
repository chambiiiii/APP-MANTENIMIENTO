import { useState, useEffect } from 'react';
import { Wrench, Car, Calendar } from 'lucide-react';
import { getAllServices } from '../lib/db';
import { formatDate } from '../lib/utils';
import { SERVICE_TYPES } from '../types';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await getAllServices();
      setServices(data);
    } catch (e) {
      console.error('Error loading services:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = filter === 'all' ? services : services.filter((s) => s.service_name === filter);

  // Count by service type
  const serviceCounts: Record<string, number> = {};
  services.forEach((s) => {
    serviceCounts[s.service_name] = (serviceCounts[s.service_name] || 0) + 1;
  });

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark">Servicios Realizados</h1>
        <p className="text-slate-500 mt-1">Historial de todos los servicios realizados</p>
      </div>

      {/* Service type filter */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({services.length})
          </button>
          {SERVICE_TYPES.map((type) => {
            const count = serviceCounts[type] || 0;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === type ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Services list */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="card p-8 text-center">
          <Wrench size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No hay servicios registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((svc) => (
            <div key={svc.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wrench size={18} className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{svc.service_name}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Car size={12} />
                      {svc.inspection?.vehicle?.patente} - {svc.inspection?.vehicle?.owner_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(svc.inspection?.entry_date || svc.created_at)}
                    </span>
                    {svc.current_mileage && <span>Km: {svc.current_mileage}</span>}
                    {svc.next_mileage_recommended && (
                      <span className="text-accent font-medium">Próximo: {svc.next_mileage_recommended} km</span>
                    )}
                  </div>
                </div>
                {svc.observations && (
                  <p className="text-xs text-slate-500 sm:max-w-xs">{svc.observations}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
