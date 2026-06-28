import { useState, useEffect } from 'react';
import { Car, ClipboardList, Wrench, TrendingUp, FilePlus, AlertCircle, ArrowRight, Droplet, Wind, type LucideIcon } from 'lucide-react';
import { getDashboardStats } from '../lib/db';
import { formatDate } from '../lib/utils';
import type { Page } from '../App';

export default function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <img src="/MAYERS_LOGO.png" alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-white p-1 shadow-sm" />
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark">Lubricentro y Servicios Mayer</h1>
          <p className="text-slate-500 mt-1">Resumen general del lubricentro</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={ClipboardList}
          label="N° Certificado"
          value={stats?.inspectionCount || 0}
          color="bg-accent"
        />
        <StatCard
          icon={Car}
          label="Vehículos Registrados"
          value={stats?.vehicleCount || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={Wrench}
          label="Servicios Realizados"
          value={stats?.topServices?.reduce((acc: number, s: any) => acc + s.count, 0) || 0}
          color="bg-green-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Servicios Más Comunes"
          value={stats?.topServices?.length || 0}
          color="bg-purple-500"
        />
        <StatCard
          icon={AlertCircle}
          label="Próximos Mantenimientos"
          value={0}
          color="bg-orange-500"
        />
      </div>

      {/* Quick action */}
      <div className="card p-6 mb-6 bg-gradient-to-r from-brand-dark to-brand-light text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Nueva Inspección Vehicular</h2>
            <p className="text-slate-300 text-sm">Registre un nuevo vehículo y realice la inspección técnica completa</p>
          </div>
          <button
            onClick={() => onNavigate('new-inspection')}
            className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <FilePlus size={20} />
            Iniciar Inspección
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent inspections */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-brand-dark">Inspecciones Recientes</h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-sm text-accent hover:text-accent-dark font-medium flex items-center gap-1"
            >
              Ver todas
              <ArrowRight size={14} />
            </button>
          </div>
          {stats?.recentInspections?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentInspections.map((insp: any) => (
                <div key={insp.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-brand-dark rounded-lg flex items-center justify-center flex-shrink-0">
                    <Car size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {insp.vehicle?.patente} - {insp.vehicle?.owner_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {insp.vehicle?.brand} {insp.vehicle?.model} - {formatDate(insp.entry_date)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    N° {String(insp.certificate_number).padStart(5, '0')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No hay inspecciones registradas</p>
            </div>
          )}
        </div>

        {/* Top services */}
        <div className="card p-6">
          <h3 className="font-bold text-brand-dark mb-4">Servicios Más Realizados</h3>
          {stats?.topServices?.length > 0 ? (
            <div className="space-y-3">
              {stats.topServices.map((svc: any) => {
                const maxCount = stats.topServices[0].count;
                const percentage = (svc.count / maxCount) * 100;
                return (
                  <div key={svc.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{svc.name}</span>
                      <span className="text-xs text-slate-500 font-bold">{svc.count}x</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No hay servicios registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Oil Statistics Section */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Droplet size={24} className="text-accent" />
          <h2 className="text-xl font-bold text-brand-dark">Estadisticas de Filtros y Aceite</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterOilCard
            icon={Droplet}
            title="Aceite de Motor"
            color="bg-amber-500"
            data={stats?.filterOilStats?.aceiteMotor}
          />
          <FilterOilCard
            icon={Droplet}
            title="Filtro de Aceite"
            color="bg-slate-600"
            data={stats?.filterOilStats?.filtroAceite}
          />
          <FilterOilCard
            icon={Wind}
            title="Filtro de Aire"
            color="bg-blue-500"
            data={stats?.filterOilStats?.filtroAire}
          />
          <FilterOilCard
            icon={Wind}
            title="Filtro de Cabina/Polen"
            color="bg-green-500"
            data={stats?.filterOilStats?.filtroCabina}
          />
        </div>
      </div>

      {/* Reminders section */}
      <div className="card p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={20} className="text-accent" />
          <h3 className="font-bold text-brand-dark">Recordatorios por Kilometraje</h3>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">
            Los vehículos que requieren mantenimiento próximo aparecerán aquí. Configure los intervalos de servicio
            en cada inspección para recibir recordatorios automáticos.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-dark">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FilterOilCard({
  icon: Icon,
  title,
  color,
  data,
}: {
  icon: LucideIcon;
  title: string;
  color: string;
  data: any[] | undefined;
}) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <h4 className="font-semibold text-brand-dark text-sm">{title}</h4>
      </div>
      {data && data.length > 0 ? (
        <div className="space-y-2">
          {data.slice(0, 5).map((item: any, idx: number) => (
            <div key={idx} className="text-xs p-2 bg-slate-50 rounded-md">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">
                  {item.part_code || 'Sin codigo'}
                </span>
                <span className="bg-accent text-white px-2 py-0.5 rounded-full font-bold">
                  {item.count}x
                </span>
              </div>
              <p className="text-slate-400 mt-1">
                Ultimo uso: {formatDate(item.lastUsed)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">Sin registros recientes</p>
        </div>
      )}
    </div>
  );
}
