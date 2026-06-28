import type { Condition } from '../types';

export function formatPatente(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function validatePatente(patente: string): boolean {
  const p = patente.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Old format: ABC123 (4 letters + 2 numbers, or 2 letters + 4 numbers)
  // New format: ABCD12 (4 letters + 2 numbers)
  // Motorcycle: AB12CD
  const oldFormat = /^[A-Z]{2}[0-9]{4}$/;
  const newFormat = /^[A-Z]{4}[0-9]{2}$/;
  const motoFormat = /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/;
  return oldFormat.test(p) || newFormat.test(p) || motoFormat.test(p);
}

export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('56')) digits = digits.slice(2);
  digits = digits.slice(0, 9);
  if (digits.length === 0) return '';
  let formatted = '+56 9';
  if (digits.length > 0) {
    const rest = digits.startsWith('9') ? digits.slice(1) : digits;
    if (rest.length > 0) formatted += ' ' + rest.slice(0, 4);
    if (rest.length > 4) formatted += ' ' + rest.slice(4, 8);
  }
  return formatted;
}

export function getPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('56')) return digits;
  return '56' + digits;
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getSemaphoreColor(condition: Condition | ''): 'green' | 'yellow' | 'red' | 'gray' {
  if (!condition) return 'gray';
  if (condition === 'Excelente' || condition === 'Bueno') return 'green';
  if (condition === 'Regular') return 'yellow';
  return 'red';
}

export function getSectionStatus(conditions: (Condition | '')[]): 'green' | 'yellow' | 'red' | 'gray' {
  if (conditions.every((c) => !c)) return 'gray';
  if (conditions.some((c) => c === 'Requiere Cambio')) return 'red';
  if (conditions.some((c) => c === 'Regular')) return 'yellow';
  return 'green';
}

export function getOverallStatus(sections: { status: string }[]): 'green' | 'yellow' | 'red' | 'gray' {
  const statuses = sections.map((s) => s.status);
  if (statuses.every((s) => s === 'gray' || !s)) return 'gray';
  if (statuses.includes('red')) return 'red';
  if (statuses.includes('yellow')) return 'yellow';
  return 'green';
}
