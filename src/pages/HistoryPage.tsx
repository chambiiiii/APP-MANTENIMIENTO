import { useState, useEffect } from 'react';
import { Search, Eye, FileText, Send, Calendar, Car, User, Wrench, X, type LucideIcon } from 'lucide-react';
import { getInspections, getInspectionById } from '../lib/db';
import { generateCertificatePDF, downloadPDF } from '../lib/pdf';
import { formatDateTime, formatDate, getPhoneDigits, getSectionStatus } from '../lib/utils';
import { CHECKLIST_SECTIONS, CONDITION_COLORS } from '../types';
import type { InspectionWithVehicle } from '../types';

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InspectionWithVehicle | null>(null);
  const [, setDetailLoading] = useState(false);

  useEffect(() => {
    loadInspections();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInspections(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadInspections = async (searchTerm = '') => {
    setLoading(true);
    try {
      const data = await getInspections(searchTerm);
      setInspections(data);
    } catch (e) {
      console.error('Error loading inspections:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await getInspectionById(id);
      setSelected(data);
    } catch (e) {
      console.error('Error loading inspection:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReprint = async (inspection: any) => {
    const fullData = inspection.items ? inspection : await getInspectionById(inspection.id);
    const blob = await generateCertificatePDF(fullData);
    downloadPDF(blob, `Certificado_${fullData.vehicle.patente}_${fullData.certificate_number}.pdf`);
  };

  const handleWhatsApp = async (inspection: any) => {
    const fullData = inspection.items ? inspection : await getInspectionById(inspection.id);
    const blob = await generateCertificatePDF(fullData);
    downloadPDF(blob, `Certificado_${fullData.vehicle.patente}_${fullData.certificate_number}.pdf`);
    const phone = getPhoneDigits(fullData.vehicle.phone);
    const message = `Hola ${fullData.vehicle.owner_name}.\n\nAdjuntamos el Certificado de Inspección Vehicular correspondiente a su vehículo patente ${fullData.vehicle.patente}.\n\nGracias por confiar en nuestro lubricentro.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getOverallStatus = (items: any[]): { status: string; color: string } => {
    if (!items || items.length === 0) return { status: 'Sin evaluar', color: 'bg-slate-300' };
    const conditions = items.map((i) => i.condition);
    const hasRed = conditions.some((c) => c === 'Malo' || c === 'Requiere Cambio');
    const hasYellow = conditions.some((c) => c === 'Regular');
    if (hasRed) return { status: 'Requiere Atención', color: 'bg-red-500' };
    if (hasYellow) return { status: 'Con Observaciones', color: 'bg-yellow-500' };
    return { status: 'Buen Estado', color: 'bg-green-500' };
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark">Historial de Inspecciones</h1>
        <p className="text-slate-500 mt-1">Busque y gestione inspecciones anteriores</p>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por patente, teléfono o nombre..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Cargando inspecciones...</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="card p-8 text-center">
          <Car size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No se encontraron inspecciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => {
            const status = getOverallStatus(insp.items);
            return (
              <div key={insp.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Vehicle info */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div>
                      <p className="text-xs text-slate-400">Certificado</p>
                      <p className="text-sm font-bold text-brand-dark">
                        N° {String(insp.certificate_number).padStart(5, '0')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Patente</p>
                      <p className="text-sm font-bold text-accent">{insp.vehicle?.patente}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Propietario</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{insp.vehicle?.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Fecha</p>
                      <p className="text-sm text-slate-700">{formatDate(insp.entry_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Km / Técnico</p>
                      <p className="text-sm text-slate-700">
                        {insp.mileage || 'N/A'} km / {insp.technician_name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${status.color}`} />
                    <span className="text-xs font-medium text-slate-600">{status.status}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(insp.id)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-brand-dark hover:text-white transition-colors"
                      title="Ver"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleReprint(insp)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-brand-dark hover:text-white transition-colors"
                      title="Reimprimir PDF"
                    >
                      <FileText size={18} />
                    </button>
                    <button
                      onClick={() => handleWhatsApp(insp)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-accent hover:text-white transition-colors"
                      title="Enviar por WhatsApp"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <InspectionDetailModal inspection={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function InspectionDetailModal({
  inspection,
  onClose,
}: {
  inspection: InspectionWithVehicle;
  onClose: () => void;
}) {
  const vehicle = inspection.vehicle!;
  const items = inspection.items || [];
  const services = inspection.services || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-dark text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-lg">Certificado N° {String(inspection.certificate_number).padStart(5, '0')}</h2>
            <p className="text-sm text-slate-300">{formatDateTime(inspection.created_at || '')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-light rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Vehicle info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <DetailItem icon={Car} label="Patente" value={vehicle.patente} />
            <DetailItem icon={User} label="Propietario" value={vehicle.owner_name} />
            <DetailItem icon={Car} label="Marca/Modelo" value={`${vehicle.brand} ${vehicle.model}`} />
            <DetailItem icon={Calendar} label="Fecha" value={formatDate(inspection.entry_date)} />
            <DetailItem icon={Wrench} label="Kilometraje" value={`${inspection.mileage || 'N/A'} km`} />
            <DetailItem icon={User} label="Técnico" value={inspection.technician_name || 'N/A'} />
          </div>

          {/* Checklist results */}
          <div>
            <h3 className="font-bold text-brand-dark mb-3">Resultados de Inspección</h3>
            <div className="space-y-3">
              {CHECKLIST_SECTIONS.map((section) => {
                const sectionItems = items.filter((i) => i.section === section.name);
                if (sectionItems.length === 0) return null;
                const conditions = sectionItems.map((i) => i.condition);
                const sectionStatus = getSectionStatus(conditions);
                const statusColors = {
                  green: 'bg-green-500',
                  yellow: 'bg-yellow-500',
                  red: 'bg-red-500',
                  gray: 'bg-slate-300',
                };
                return (
                  <div key={section.name} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${statusColors[sectionStatus]}`} />
                      <h4 className="font-semibold text-sm text-slate-800">{section.name}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sectionItems.map((item) => (
                        <div key={item.item_name} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{item.item_name}</span>
                          {item.condition && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[item.condition].bg} ${CONDITION_COLORS[item.condition].text}`}
                            >
                              {item.condition}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div>
              <h3 className="font-bold text-brand-dark mb-3">Servicios Realizados</h3>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <span key={s.service_name} className="bg-accent/10 text-accent px-3 py-1.5 rounded-lg text-sm font-medium">
                    {s.service_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Observations */}
          {inspection.general_observations && (
            <div>
              <h3 className="font-bold text-brand-dark mb-2">Observaciones Generales</h3>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{inspection.general_observations}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={async () => {
                const blob = await generateCertificatePDF(inspection);
                downloadPDF(blob, `Certificado_${vehicle.patente}_${inspection.certificate_number}.pdf`);
              }}
              className="btn-secondary flex items-center justify-center gap-2 flex-1"
            >
              <FileText size={20} />
              Descargar PDF
            </button>
            <button
              onClick={async () => {
                const blob = await generateCertificatePDF(inspection);
                downloadPDF(blob, `Certificado_${vehicle.patente}_${inspection.certificate_number}.pdf`);
                const phone = getPhoneDigits(vehicle.phone);
                const message = `Hola ${vehicle.owner_name}.\n\nAdjuntamos el Certificado de Inspección Vehicular correspondiente a su vehículo patente ${vehicle.patente}.\n\nGracias por confiar en nuestro lubricentro.`;
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="btn-primary flex items-center justify-center gap-2 flex-1"
            >
              <Send size={20} />
              Enviar WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
