import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generates a professional PDF invoice for an appointment
 * @param {Object} appointment - The appointment details
 * @param {Object} org - The organization details
 */
export const generateInvoice = (appointment, org) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // --- Header & Branding ---
    // Add a colored bar at the top
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(org?.name || 'Appointment Receipt', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL BOOKING RECEIPT', 20, 32);
    
    // --- Right Aligned Header Info ---
    doc.textAlign = 'right';
    doc.setFontSize(10);
    doc.text(`Receipt #: ${appointment.display_token || appointment.id.slice(-8).toUpperCase()}`, pageWidth - 20, 18, { align: 'right' });
    doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Status: ${appointment.status.toUpperCase()}`, pageWidth - 20, 32, { align: 'right' });
    
    // --- Organization & Customer Details ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROVIDER DETAILS', 20, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text([
        org?.name,
        org?.address || '',
        `${org?.city || ''}, ${org?.state || ''} ${org?.pincode || ''}`,
        `Phone: ${org?.contact_phone || 'N/A'}`,
        `Email: ${org?.contact_email || 'N/A'}`
    ].filter(Boolean), 20, 62);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CUSTOMER DETAILS', pageWidth / 2 + 10, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text([
        appointment.customer_name || 'Valued Guest',
        appointment.customer_email || 'Walk-in Customer',
        `Token: ${appointment.display_token || appointment.token_number || appointment.id.slice(-8).toUpperCase()}`,
        `Payment: ${appointment.payment_status?.toUpperCase() || 'UNPAID'}`
    ].filter(Boolean), pageWidth / 2 + 10, 62);
    
    // --- Service Details Table ---
    doc.autoTable({
        startY: 95,
        head: [['Service Description', 'Provider/Resource', 'Scheduled Date', 'Amount']],
        body: [
            [
                appointment.service_name || 'Standard Service',
                appointment.resource_name || appointment.resource_id || 'Staff',
                format(new Date(appointment.date || appointment.created_at), 'dd MMM yyyy, hh:mm a'),
                `INR ${(appointment.price || 0).toFixed(2)}`
            ]
        ],
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            3: { halign: 'right', fontStyle: 'bold' }
        }
    });
    
    // --- Summary Section ---
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setDrawColor(243, 244, 246);
    doc.line(pageWidth - 80, finalY, pageWidth - 20, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', pageWidth - 80, finalY + 10);
    doc.text(`INR ${(appointment.price || 0).toFixed(2)}`, pageWidth - 20, finalY + 10, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Total Paid:', pageWidth - 80, finalY + 22);
    doc.text(`INR ${(appointment.price || 0).toFixed(2)}`, pageWidth - 20, finalY + 22, { align: 'right' });
    
    // --- Footer ---
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'italic');
    const footerText = 'This is a computer-generated receipt. No signature required.';
    doc.text(footerText, pageWidth / 2, 280, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Thank you for choosing ${org?.name || 'us'}!`, pageWidth / 2, 285, { align: 'center' });
    
    // Save the PDF
    const fileName = `Receipt_${appointment.display_token || appointment.id.slice(-6)}.pdf`;
    doc.save(fileName);
};
