import { useState } from 'react';
import { User, Car, ClipboardList, Wrench, FileText, Send, Save, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Camera, X, type LucideIcon } from 'lucide-react';
import type { Vehicle, InspectionItem, ServicePerformed } from '../types';
import { CHECKLIST_SECTIONS, CONDITIONS, TRANSMISSIONS, SERVICE_TYPES, CONDITION_COLORS, SERVICES_WITH_PART_CODE } from '../types';
import { formatPatente, validatePatente, formatPhone, getPhoneDigits, getTodayDate, getSemaphoreColor, getSectionStatus } from '../lib/utils';
import { saveInspection } from '../lib/db';
import { generateCertificatePDF, downloadPDF } from '../lib/pdf';

type Step = 'vehicle' | 'checklist' | 'services' | 'review';

const STEPS: { id: Step; label: string; icon: LucideIcon }[] = [
  { id: 'vehicle', label: 'Datos del Vehículo', icon: Car },
  { id: 'checklist', label: 'Checklist de Inspección', icon: ClipboardList },
  { id: 'services', label: 'Servicios Realizados', icon: Wrench },
  { id: 'review', label: 'Revisión y Certificado', icon: FileText },
];

export default function NewInspection() {
  const [step, setStep] = useState<Step>('vehicle');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [savedInspection, setSavedInspection] = useState<any>(null);

  const [vehicle, setVehicle] = useState<Omit<Vehicle, 'id'>>({
    patente: '',
    owner_name: '',
    phone: '',
    brand: '',
    model: '',
    year: null,
    transmission: '',
    observations: '',
  });

  const [inspection, setInspection] = useState({
    entry_date: getTodayDate(),
    mileage: null as number | null,
    technician_name: '',
    general_observations: '',
  });

  const [items, setItems] = useState<InspectionItem[]>(() => {
    const allItems: InspectionItem[] = [];
    CHECKLIST_SECTIONS.forEach((section) => {
      section.items.forEach((itemName) => {
        allItems.push({
          section: section.name,
          item_name: itemName,
          condition: '',
          observations: '',
          recommendations: '',
          next_service_date: '',
          photo_url: '',
        });
      });
    });
    return allItems;
  });

  const [services, setServices] = useState<ServicePerformed[]>([]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const handleVehicleChange = (field: keyof typeof vehicle, value: any) => {
    setVehicle((prev) => ({ ...prev, [field]: value }));
  };

  const handleInspectionChange = (field: string, value: any) => {
    setInspection((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof InspectionItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleService = (serviceName: string) => {
    setServices((prev) => {
      const existing = prev.find((s) => s.service_name === serviceName);
      if (existing) {
        return prev.filter((s) => s.service_name !== serviceName);
      }
      return [
        ...prev,
        {
          service_name: serviceName,
          current_mileage: inspection.mileage,
          next_mileage_recommended: null,
          observations: '',
          part_code: '',
        },
      ];
    });
  };

  const handleServiceChange = (serviceName: string, field: keyof ServicePerformed, value: any) => {
    setServices((prev) =>
      prev.map((s) => (s.service_name === serviceName ? { ...s, [field]: value } : s))
    );
  };

  const validateVehicleStep = (): boolean => {
    if (!vehicle.patente || !validatePatente(vehicle.patente)) {
      setError('La patente no tiene un formato chileno válido (ej: ABCD12, AB1234)');
      return false;
    }
    if (!vehicle.owner_name.trim()) {
      setError('El nombre del propietario es obligatorio');
      return false;
    }
    if (!vehicle.phone.trim()) {
      setError('El teléfono es obligatorio');
      return false;
    }
    if (!vehicle.brand.trim()) {
      setError('La marca es obligatoria');
      return false;
    }
    if (!vehicle.model.trim()) {
      setError('El modelo es obligatorio');
      return false;
    }
    if (!inspection.technician_name.trim()) {
      setError('El nombre del técnico es obligatorio');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 'vehicle' && !validateVehicleStep()) return;
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1].id);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const filledItems = items.filter((i) => i.condition);
      const result = await saveInspection(vehicle, inspection, filledItems, services);
      setSavedInspection({
        ...result.inspection,
        vehicle: result.vehicle,
        items: filledItems,
        services,
      });
      setSaved(true);
    } catch (e: any) {
      setError(`Error al guardar: ${e.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!savedInspection) return;
    const blob = await generateCertificatePDF(savedInspection);
    downloadPDF(blob, `Certificado_${savedInspection.vehicle.patente}_${savedInspection.certificate_number}.pdf`);
  };

  const handleSendWhatsApp = async () => {
    if (!savedInspection) return;
    const blob = await generateCertificatePDF(savedInspection);
    downloadPDF(blob, `Certificado_${savedInspection.vehicle.patente}_${savedInspection.certificate_number}.pdf`);

    const phone = getPhoneDigits(savedInspection.vehicle.phone);
    const message = `Hola ${savedInspection.vehicle.owner_name}.\n\nAdjuntamos el Certificado de Inspección Vehicular correspondiente a su vehículo patente ${savedInspection.vehicle.patente}.\n\nGracias por confiar en nuestro lubricentro.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleNewInspection = () => {
    setVehicle({
      patente: '',
      owner_name: '',
      phone: '',
      brand: '',
      model: '',
      year: null,
      transmission: '',
      observations: '',
    });
    setInspection({
      entry_date: getTodayDate(),
      mileage: null,
      technician_name: '',
      general_observations: '',
    });
    setItems(() => {
      const allItems: InspectionItem[] = [];
      CHECKLIST_SECTIONS.forEach((section) => {
        section.items.forEach((itemName) => {
          allItems.push({
            section: section.name,
            item_name: itemName,
            condition: '',
            observations: '',
            recommendations: '',
            next_service_date: '',
            photo_url: '',
          });
        });
      });
      return allItems;
    });
    setServices([]);
    setSavedInspection(null);
    setSaved(false);
    setStep('vehicle');
  };

  if (saved && savedInspection) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="card p-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-brand-dark mb-2">Inspección Guardada Exitosamente</h2>
          <p className="text-slate-500 mb-6">
            Certificado N° {String(savedInspection.certificate_number).padStart(5, '0')} -{' '}
            {savedInspection.vehicle.patente}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button onClick={handleGeneratePDF} className="btn-secondary flex items-center justify-center gap-2">
              <FileText size={20} />
              Descargar PDF
            </button>
            <button onClick={handleSendWhatsApp} className="btn-primary flex items-center justify-center gap-2">
              <Send size={20} />
              Enviar al Cliente
            </button>
          </div>

          <button
            onClick={handleNewInspection}
            className="btn-outline flex items-center justify-center gap-2 mx-auto"
          >
            <FileText size={20} />
            Nueva Inspección
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-brand-dark">Nueva Inspección Vehicular</h1>
        <p className="text-slate-500 mt-1">Complete los datos del vehículo y realice la inspección técnica</p>
      </div>

      {/* Stepper */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between overflow-x-auto">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = idx === stepIndex;
            const isComplete = idx < stepIndex;
            return (
              <div key={s.id} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                      ${isActive ? 'bg-accent text-white shadow-md scale-110' : ''}
                      ${isComplete ? 'bg-green-500 text-white' : ''}
                      ${!isActive && !isComplete ? 'bg-slate-200 text-slate-400' : ''}
                    `}
                  >
                    {isComplete ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <span
                    className={`text-xs font-medium text-center hidden sm:block ${
                      isActive ? 'text-accent' : isComplete ? 'text-green-600' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all duration-200 ${
                      isComplete ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Step content */}
      {step === 'vehicle' && (
        <VehicleForm
          vehicle={vehicle}
          inspection={inspection}
          onVehicleChange={handleVehicleChange}
          onInspectionChange={handleInspectionChange}
        />
      )}

      {step === 'checklist' && (
        <ChecklistForm items={items} onItemChange={handleItemChange} />
      )}

      {step === 'services' && (
        <ServicesForm
          services={services}
          mileage={inspection.mileage}
          onToggle={toggleService}
          onChange={handleServiceChange}
        />
      )}

      {step === 'review' && (
        <ReviewForm
          vehicle={vehicle}
          inspection={inspection}
          items={items}
          services={services}
          generalObservations={inspection.general_observations}
          onGeneralObservationsChange={(val) => handleInspectionChange('general_observations', val)}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6 pb-20 lg:pb-6">
        <button
          onClick={handlePrev}
          disabled={stepIndex === 0}
          className="btn-outline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
          Anterior
        </button>

        {stepIndex < STEPS.length - 1 ? (
          <button onClick={handleNext} className="btn-primary flex items-center gap-2">
            Siguiente
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Inspección
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ============ VEHICLE FORM ============
function VehicleForm({
  vehicle,
  inspection,
  onVehicleChange,
  onInspectionChange,
}: {
  vehicle: Omit<Vehicle, 'id'>;
  inspection: any;
  onVehicleChange: (field: keyof Omit<Vehicle, 'id'>, value: any) => void;
  onInspectionChange: (field: string, value: any) => void;
}) {
  const patenteValid = vehicle.patente ? validatePatente(vehicle.patente) : true;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Vehicle data */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Car size={20} className="text-accent" />
          <h3 className="font-bold text-brand-dark">Datos del Vehículo</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label-field">Patente *</label>
            <input
              type="text"
              value={vehicle.patente}
              onChange={(e) => onVehicleChange('patente', formatPatente(e.target.value))}
              placeholder="ABCD12"
              className={`input-field uppercase ${!patenteValid ? 'border-red-500' : ''}`}
              maxLength={6}
            />
            {!patenteValid && (
              <p className="text-xs text-red-500 mt-1">Formato de patente chilena no válido</p>
            )}
          </div>
          <div>
            <label className="label-field">Marca *</label>
            <input
              type="text"
              value={vehicle.brand}
              onChange={(e) => onVehicleChange('brand', e.target.value)}
              placeholder="Toyota"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Modelo *</label>
            <input
              type="text"
              value={vehicle.model}
              onChange={(e) => onVehicleChange('model', e.target.value)}
              placeholder="Corolla"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Año</label>
            <input
              type="number"
              value={vehicle.year || ''}
              onChange={(e) => onVehicleChange('year', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="2023"
              className="input-field"
              min="1900"
              max="2030"
            />
          </div>
          <div>
            <label className="label-field">Transmisión</label>
            <select
              value={vehicle.transmission}
              onChange={(e) => onVehicleChange('transmission', e.target.value)}
              className="input-field"
            >
              <option value="">Seleccionar...</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Kilometraje</label>
            <input
              type="number"
              value={inspection.mileage || ''}
              onChange={(e) => onInspectionChange('mileage', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="50000"
              className="input-field"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Owner data */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-accent" />
          <h3 className="font-bold text-brand-dark">Datos del Propietario</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Nombre del Propietario *</label>
            <input
              type="text"
              value={vehicle.owner_name}
              onChange={(e) => onVehicleChange('owner_name', e.target.value)}
              placeholder="Juan Pérez"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Teléfono *</label>
            <input
              type="tel"
              value={vehicle.phone}
              onChange={(e) => onVehicleChange('phone', formatPhone(e.target.value))}
              placeholder="+56 9 XXXX XXXX"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Inspection data */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={20} className="text-accent" />
          <h3 className="font-bold text-brand-dark">Datos de la Inspección</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Fecha de Ingreso</label>
            <input
              type="date"
              value={inspection.entry_date}
              onChange={(e) => onInspectionChange('entry_date', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Técnico Responsable *</label>
            <input
              type="text"
              value={inspection.technician_name}
              onChange={(e) => onInspectionChange('technician_name', e.target.value)}
              placeholder="Nombre del técnico"
              className="input-field"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="label-field">Observaciones Generales</label>
          <textarea
            value={vehicle.observations}
            onChange={(e) => onVehicleChange('observations', e.target.value)}
            placeholder="Observaciones generales del vehículo..."
            className="input-field min-h-[80px] resize-y"
          />
        </div>
      </div>
    </div>
  );
}

// ============ CHECKLIST FORM ============
function ChecklistForm({
  items,
  onItemChange,
}: {
  items: InspectionItem[];
  onItemChange: (index: number, field: keyof InspectionItem, value: any) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {CHECKLIST_SECTIONS.map((section) => {
        const sectionItems = items
          .map((item, idx) => ({ item, idx }))
          .filter(({ item }) => item.section === section.name);
        const conditions = sectionItems.map(({ item }) => item.condition);
        const sectionStatus = getSectionStatus(conditions);

        const statusColors = {
          green: 'bg-green-500',
          yellow: 'bg-yellow-500',
          red: 'bg-red-500',
          gray: 'bg-slate-300',
        };

        return (
          <div key={section.name} className="card overflow-hidden">
            <div className="bg-brand-dark text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${statusColors[sectionStatus]}`} />
                {section.name}
              </h3>
              <span className="text-xs text-slate-300">{section.items.length} puntos</span>
            </div>

            <div className="p-4 space-y-3">
              {sectionItems.map(({ item, idx }) => (
                <div
                  key={item.item_name}
                  className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm mb-2">{item.item_name}</p>
                      <div className="flex flex-wrap gap-2">
                        {CONDITIONS.map((cond) => {
                          const isSelected = item.condition === cond;
                          const color = CONDITION_COLORS[cond];
                          return (
                            <button
                              key={cond}
                              onClick={() => onItemChange(idx, 'condition', isSelected ? '' : cond)}
                              className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                                ${isSelected
                                  ? `${color.bg} ${color.text} ring-2 ring-offset-1 ring-current`
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }
                              `}
                            >
                              <span className={`inline-block w-2 h-2 rounded-full ${color.dot} mr-1.5`} />
                              {cond}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${item.condition ? statusColors[getSemaphoreColor(item.condition)] : 'bg-slate-200'}`} />
                    </div>
                  </div>

                  {item.condition && item.condition !== 'Bueno' && (
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-in">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Observaciones</label>
                        <input
                          type="text"
                          value={item.observations}
                          onChange={(e) => onItemChange(idx, 'observations', e.target.value)}
                          placeholder="Observaciones..."
                          className="input-field text-sm py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Recomendaciones</label>
                        <input
                          type="text"
                          value={item.recommendations}
                          onChange={(e) => onItemChange(idx, 'recommendations', e.target.value)}
                          placeholder="Recomendaciones..."
                          className="input-field text-sm py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Próximo servicio</label>
                        <input
                          type="date"
                          value={item.next_service_date}
                          onChange={(e) => onItemChange(idx, 'next_service_date', e.target.value)}
                          className="input-field text-sm py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Fotografía</label>
                        <PhotoUpload
                          photoUrl={item.photo_url}
                          onChange={(url) => onItemChange(idx, 'photo_url', url)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Auto recommendation */}
              {conditions.some((c) => c === 'Requiere Cambio') && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2 animate-fade-in">
                  <AlertCircle size={16} className="text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700">{section.autoRecommendation}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ PHOTO UPLOAD ============
function PhotoUpload({ photoUrl, onChange }: { photoUrl: string; onChange: (url: string) => void }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-2">
      {photoUrl ? (
        <div className="relative">
          <img src={photoUrl} alt="Foto" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
          <button
            onClick={() => onChange('')}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-accent hover:text-accent transition-colors">
          <Camera size={14} />
          Adjuntar
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      )}
    </div>
  );
}

// ============ SERVICES FORM ============
function ServicesForm({
  services,
  mileage,
  onToggle,
  onChange,
}: {
  services: ServicePerformed[];
  mileage: number | null;
  onToggle: (name: string) => void;
  onChange: (name: string, field: keyof ServicePerformed, value: any) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={20} className="text-accent" />
          <h3 className="font-bold text-brand-dark">Servicios Realizados</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Seleccione los servicios realizados y complete los detalles. El kilometraje actual se autocompleta con el del vehículo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SERVICE_TYPES.map((svc) => {
            const selected = services.find((s) => s.service_name === svc);
            return (
              <button
                key={svc}
                onClick={() => onToggle(svc)}
                className={`
                  px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left
                  ${selected
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  {svc}
                  {selected && <CheckCircle size={16} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {services.length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold text-brand-dark mb-4">Detalle de Servicios</h3>
          <div className="space-y-4">
            {services.map((svc) => {
              const requiresPartCode = SERVICES_WITH_PART_CODE.includes(svc.service_name);
              return (
              <div key={svc.service_name} className="border border-slate-200 rounded-lg p-4">
                <p className="font-semibold text-slate-800 text-sm mb-3">{svc.service_name}</p>
                <div className={`grid grid-cols-1 sm:grid-cols-${requiresPartCode ? '4' : '3'} gap-3`}>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Km. Actual</label>
                    <input
                      type="number"
                      value={svc.current_mileage || ''}
                      onChange={(e) =>
                        onChange(svc.service_name, 'current_mileage', e.target.value ? parseInt(e.target.value) : null)
                      }
                      placeholder={String(mileage || '0')}
                      className="input-field text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Próximo Km.</label>
                    <input
                      type="number"
                      value={svc.next_mileage_recommended || ''}
                      onChange={(e) =>
                        onChange(
                          svc.service_name,
                          'next_mileage_recommended',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      placeholder="60000"
                      className="input-field text-sm py-2"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[3000, 5000, 7000, 8000, 10000].map((km) => (
                        <button
                          key={km}
                          onClick={() =>
                            onChange(
                              svc.service_name,
                              'next_mileage_recommended',
                              (svc.current_mileage || mileage || 0) + km
                            )
                          }
                          className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-accent hover:text-white transition-colors"
                        >
                          +{km.toLocaleString('es-CL')} km
                        </button>
                      ))}
                    </div>
                  </div>
                  {requiresPartCode && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Codigo de parte o Modelo</label>
                      <input
                        type="text"
                        value={svc.part_code || ''}
                        onChange={(e) => onChange(svc.service_name, 'part_code', e.target.value)}
                        placeholder="Ej: ABC123"
                        className="input-field text-sm py-2"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Observaciones</label>
                    <input
                      type="text"
                      value={svc.observations}
                      onChange={(e) => onChange(svc.service_name, 'observations', e.target.value)}
                      placeholder="Observaciones..."
                      className="input-field text-sm py-2"
                    />
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ REVIEW FORM ============
function ReviewForm({
  vehicle,
  inspection,
  items,
  services,
  generalObservations,
  onGeneralObservationsChange,
}: {
  vehicle: Omit<Vehicle, 'id'>;
  inspection: any;
  items: InspectionItem[];
  services: ServicePerformed[];
  generalObservations: string;
  onGeneralObservationsChange: (val: string) => void;
}) {
  const evaluatedItems = items.filter((i) => i.condition);
  const sectionStatuses = CHECKLIST_SECTIONS.map((section) => {
    const sectionItems = items.filter((i) => i.section === section.name);
    const conditions = sectionItems.map((i) => i.condition);
    return { name: section.name, conditions, status: getSectionStatus(conditions) };
  });

  const statusColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-slate-300',
  };

  const statusLabels = {
    green: 'Buen Estado',
    yellow: 'Regular',
    red: 'Requiere Atención',
    gray: 'No Evaluado',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Vehicle summary */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Car size={20} className="text-accent" />
          <h3 className="font-bold text-brand-dark">Resumen del Vehículo</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <InfoBox label="Patente" value={vehicle.patente} />
          <InfoBox label="Propietario" value={vehicle.owner_name} />
          <InfoBox label="Teléfono" value={vehicle.phone} />
          <InfoBox label="Marca/Modelo" value={`${vehicle.brand} ${vehicle.model}`} />
          <InfoBox label="Año" value={String(vehicle.year || 'N/A')} />
          <InfoBox label="Transmisión" value={vehicle.transmission || 'N/A'} />
          <InfoBox label="Kilometraje" value={`${inspection.mileage || 'N/A'} km`} />
          <InfoBox label="Técnico" value={inspection.technician_name} />
        </div>
      </div>

      {/* Section status summary */}
      <div className="card p-6">
        <h3 className="font-bold text-brand-dark mb-4">Estado de Sistemas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {sectionStatuses.map((s) => (
            <div key={s.name} className="text-center">
              <div
                className={`w-12 h-12 rounded-full ${statusColors[s.status]} mx-auto mb-2 flex items-center justify-center`}
              >
                <span className="text-white text-xs font-bold">
                  {s.status === 'green' ? 'OK' : s.status === 'red' ? '!' : s.status === 'yellow' ? '?' : '-'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-700">{s.name}</p>
              <p className="text-xs text-slate-400">{statusLabels[s.status]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services summary */}
      {services.length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold text-brand-dark mb-4">Servicios a Realizar ({services.length})</h3>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <span key={s.service_name} className="bg-accent/10 text-accent px-3 py-1.5 rounded-lg text-sm font-medium">
                {s.service_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* General observations */}
      <div className="card p-6">
        <label className="label-field">Observaciones Generales del Certificado</label>
        <textarea
          value={generalObservations}
          onChange={(e) => onGeneralObservationsChange(e.target.value)}
          placeholder="Observaciones generales que aparecerán en el certificado..."
          className="input-field min-h-[100px] resize-y"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-dark">{evaluatedItems.length}</p>
          <p className="text-xs text-slate-500">Puntos Evaluados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-accent">{services.length}</p>
          <p className="text-xs text-slate-500">Servicios</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-dark">{CHECKLIST_SECTIONS.length}</p>
          <p className="text-xs text-slate-500">Secciones</p>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
