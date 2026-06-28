import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { InspectionWithVehicle } from '../types';
import { CHECKLIST_SECTIONS } from '../types';
import { formatDateTime } from './utils';

export async function generateCertificatePDF(inspection: InspectionWithVehicle): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Load logo
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await fetchLogoAsDataUrl('/MAYERS_LOGO.png');
  } catch {
    // If logo fails to load, continue without it
  }

  // Header background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Accent line
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 40, pageWidth, 2, 'F');

  // Logo
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, 4, 32, 32);
  } else {
    doc.setFillColor(249, 115, 22);
    doc.circle(margin + 8, 20, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('LUB', margin + 8, 22, { align: 'center' });
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO DE INSPECCIÓN VEHICULAR', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Lubricentro y Servicios Mayer', pageWidth / 2, 26, { align: 'center' });

  // Date and time
  let y = 50;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha y Hora: ${formatDateTime(inspection.created_at || new Date().toISOString())}`, margin, y);

  // Vehicle info box
  y += 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  const vehicle = inspection.vehicle!;
  const infoY = y + 8;
  const colWidth = contentWidth / 2;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);

  const infoRows = [
    ['Patente:', vehicle.patente, 'Propietario:', vehicle.owner_name],
    ['Teléfono:', vehicle.phone, 'Marca/Modelo:', `${vehicle.brand} ${vehicle.model}`],
    ['Año:', String(vehicle.year || 'N/A'), 'Transmisión:', vehicle.transmission || 'N/A'],
    ['Kilometraje:', `${inspection.mileage || 'N/A'} km`, 'Técnico:', inspection.technician_name || 'N/A'],
  ];

  infoRows.forEach((row, idx) => {
    const rowY = infoY + idx * 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(row[0], margin + 4, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], margin + 24, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(row[2], margin + colWidth + 4, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[3], margin + colWidth + 24, rowY);
  });

  y += 44;

  // Executive summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMEN EJECUTIVO', margin, y);
  doc.setFillColor(249, 115, 22);
  doc.rect(margin, y + 1, 30, 1, 'F');

  y += 7;

  const items = inspection.items || [];
  const sectionStatuses = CHECKLIST_SECTIONS.map((section) => {
    const sectionItems = items.filter((i) => i.section === section.name);
    const conditions = sectionItems.map((i) => i.condition);
    const hasRed = conditions.some((c) => c === 'Requiere Cambio');
    const hasYellow = conditions.some((c) => c === 'Regular');
    const status = hasRed ? 'Requiere Cambio' : hasYellow ? 'Regular' : 'Bueno';
    return { name: section.name, status };
  });

  const redCount = sectionStatuses.filter((s) => s.status === 'Requiere Cambio').length;
  const yellowCount = sectionStatuses.filter((s) => s.status === 'Regular').length;
  const greenCount = sectionStatuses.filter((s) => s.status === 'Bueno').length;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const summaryText = `Se inspectuaron ${CHECKLIST_SECTIONS.length} sistemas del vehículo. ${greenCount} sistemas en buen estado, ${yellowCount} con observaciones (regular), y ${redCount} sistemas que requieren atención inmediata.`;
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 3;

  // Semaphore summary
  const semWidth = contentWidth / 3;
  const semaphores = [
    { color: [34, 197, 94], count: greenCount, label: 'Buen Estado' },
    { color: [234, 179, 8], count: yellowCount, label: 'Regular' },
    { color: [239, 68, 68], count: redCount, label: 'Requiere Atención' },
  ];

  semaphores.forEach((sem, idx) => {
    const x = margin + idx * semWidth;
    doc.setFillColor(sem.color[0], sem.color[1], sem.color[2]);
    doc.roundedRect(x + 4, y, semWidth - 8, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(String(sem.count), x + semWidth / 2, y + 6, { align: 'center' });
    doc.setFontSize(7);
    doc.text(sem.label, x + semWidth / 2, y + 11, { align: 'center' });
  });

  y += 20;

  // Checklist table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DETALLE DE INSPECCIÓN', margin, y);
  doc.setFillColor(249, 115, 22);
  doc.rect(margin, y + 1, 40, 1, 'F');
  y += 5;

  const tableData: any[][] = [];
  let currentSection = '';

  CHECKLIST_SECTIONS.forEach((section) => {
    const sectionItems = items.filter((i) => i.section === section.name);
    section.items.forEach((itemName) => {
      const item = sectionItems.find((i) => i.item_name === itemName);
      const condition = item?.condition || 'No evaluado';
      const obs = item?.observations || '-';
      tableData.push([
        section.name !== currentSection ? section.name : '',
        itemName,
        condition,
        obs,
      ]);
      currentSection = section.name;
    });
  });

  autoTable(doc, {
    startY: y,
    head: [['Sección', 'Punto de Inspección', 'Estado', 'Observaciones']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = String(data.cell.text[0] || '');
        if (val === 'Excelente' || val === 'Bueno') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Regular') {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Requiere Cambio') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 8;

  // Services performed - Highlighted section
  const services = inspection.services || [];
  if (services.length > 0) {
    // Highlighted background for services section
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(margin - 2, y - 3, contentWidth + 4, 10, 2, 2, 'F');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(249, 115, 22);
    doc.text('SERVICIOS REALIZADOS', margin, y + 4);
    doc.setFillColor(249, 115, 22);
    doc.rect(margin, y + 6, 38, 1.5, 'F');
    y += 12;

    const serviceData = services.map((s: any) => [
      s.service_name,
      s.current_mileage ? `${s.current_mileage.toLocaleString()} km` : '-',
      s.next_mileage_recommended ? `${s.next_mileage_recommended.toLocaleString()} km` : '-',
      s.observations || '-',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Servicio', 'Km. Actual', 'PROXIMO KM.', 'OBSERVACIONES']],
      body: serviceData,
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [15, 23, 42],
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center' },
        2: {
          cellWidth: 40,
          halign: 'center',
          fontStyle: 'bold',
          textColor: [249, 115, 22],
          fillColor: [255, 247, 237],
        },
        3: { cellWidth: 'auto', fontStyle: 'italic' },
      },
      didParseCell: (data) => {
        // Highlight 'Próximo Km.' column in body
        if (data.section === 'body' && data.column.index === 2) {
          const val = String(data.cell.text[0] || '');
          if (val !== '-') {
            data.cell.styles.textColor = [234, 88, 12];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [255, 237, 213];
          }
        }
        // Highlight 'Observaciones' column
        if (data.section === 'body' && data.column.index === 3) {
          const val = String(data.cell.text[0] || '');
          if (val !== '-') {
            data.cell.styles.fillColor = [254, 252, 232];
          }
        }
      },
    });

    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Recommendations
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('RECOMENDACIONES FINALES', margin, y);
  doc.setFillColor(249, 115, 22);
  doc.rect(margin, y + 1, 42, 1, 'F');
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  CHECKLIST_SECTIONS.forEach((section) => {
    const sectionItems = items.filter((i) => i.section === section.name);
    const hasBadItem = sectionItems.some(
      (i) => i.condition === 'Requiere Cambio'
    );
    if (hasBadItem) {
      const lines = doc.splitTextToSize(`• ${section.name}: ${section.autoRecommendation}`, contentWidth - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4 + 1;
    }
  });

  if (inspection.general_observations) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones Generales:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    const obsLines = doc.splitTextToSize(inspection.general_observations, contentWidth - 4);
    doc.text(obsLines, margin + 2, y);
    y += obsLines.length * 4;
  }

  // Check if we need a new page for footer
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 30;
  }

  // Technician signature
  y += 15;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(margin + 20, y, margin + 90, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.technician_name || 'Técnico Responsable', margin + 55, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Técnico Responsable - Firma Digital', margin + 55, y + 9, { align: 'center' });

  // QR Code
  try {
    const qrData = `CERT-${vehicle.patente}-${new Date(inspection.created_at || Date.now()).toISOString()}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 80, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 25, y - 15, 25, 25);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Escanee para validar', pageWidth - margin - 12, y + 13, { align: 'center' });
  } catch (e) {
    // QR generation failed, skip
  }

  // Footer
  const footerY = pageHeight - 20;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, footerY, pageWidth, 20, 'F');
  doc.setFillColor(249, 115, 22);
  doc.rect(0, footerY, pageWidth, 1, 'F');
  doc.setTextColor(200, 210, 225);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Este certificado refleja el estado del vehículo al momento de la inspección y constituye una recomendación técnica preventiva.',
    pageWidth / 2,
    footerY + 8,
    { align: 'center' }
  );
  doc.setFontSize(6);
  doc.text(
    'Lubricentro y Servicios Mayer',
    pageWidth / 2,
    footerY + 14,
    { align: 'center' }
  );

  return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function fetchLogoAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
