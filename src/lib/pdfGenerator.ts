import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Client } from '../types/database';
import { format } from 'date-fns';
import { logoBase64 } from './logoBase64';
import { numberToWords } from './numberToWords';

interface PDFQuotationData {
  quoteNumber: string;
  quoteDate: string;
  client: Client;
  items: Array<{
    productName: string;
    description?: string;
    hsn: string;
    quantity: number;
    uom: string;
    rate: number;
    taxPercent: number;
    taxAmount: number;
    total: number;
  }>;
  netAmount: number;
  terms: any;
}

export const generateQuotationPDF = (data: PDFQuotationData, action: 'save' | 'preview' = 'save') => {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // Colors based on the Tailwind UI
  const cGray50: [number, number, number] = [249, 250, 251];
  const cGray100: [number, number, number] = [243, 244, 246];
  const cGray400: [number, number, number] = [156, 163, 175];
  const cGray500: [number, number, number] = [107, 114, 128];
  const cGray600: [number, number, number] = [75, 85, 99];
  const cGray800: [number, number, number] = [31, 41, 55];
  const cGray900: [number, number, number] = [17, 24, 39];
  
  const cBlue50: [number, number, number] = [239, 246, 255];
  const cBlue100: [number, number, number] = [219, 234, 254];
  const cBlue700: [number, number, number] = [29, 78, 216];
  const cBlue800: [number, number, number] = [30, 64, 175];
  
  const cMaroon: [number, number, number] = [145, 39, 35];

  const formatAmount = (num: number) => {
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const isKarnataka = (data.client.state || "").toLowerCase().includes("karnataka");

  // Helper for drawing rounded boxes
  const drawCard = (x: number, y: number, w: number, h: number, fill: [number,number,number], stroke: [number,number,number]) => {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 3, 3, 'FD');
  };

  let currentY = margin;

  // 1. Header (Logo & Company Info)
  // Logo Left
  try {
    doc.addImage(logoBase64, 'JPEG', margin, currentY, 28, 28);
  } catch (e) {
    console.error("Could not load logo", e);
  }

  // Company Info Right (Blue Card)
  const compCardW = 100;
  const compCardX = pageWidth - margin - compCardW;
  const compCardH = 28;
  drawCard(compCardX, currentY, compCardW, compCardH, cBlue50, cBlue100);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(cMaroon[0], cMaroon[1], cMaroon[2]);
  doc.text("Hertz & Bytes Technologies", pageWidth - margin - 4, currentY + 5, { align: 'right' });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(cGray600[0], cGray600[1], cGray600[2]);
  doc.text("96, 6th Cross, Venkatadri Lake View, Hosa Road, Parappana Agrahara,", pageWidth - margin - 4, currentY + 10, { align: 'right' });
  doc.text("Bangalore, Karnataka, 560100", pageWidth - margin - 4, currentY + 13, { align: 'right' });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("GSTIN: 29AJGPG7739M1ZJ", pageWidth - margin - 4, currentY + 18, { align: 'right' });
  
  doc.setFont("helvetica", "normal");
  doc.text("ganesan@hertznbytes.com  +91 8892070585", pageWidth - margin - 4, currentY + 23, { align: 'right' });

  currentY += compCardH + 6;

  // 2. Client & Quotation Detail Cards
  const midCardW = (pageWidth - (margin * 2) - 8) / 2;
  const midCardH = 26;

  // To Card (Left)
  drawCard(margin, currentY, midCardW, midCardH, cGray50, cGray100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cGray500[0], cGray500[1], cGray500[2]);
  doc.text("To", margin + 4, currentY + 4);
  
  doc.setFontSize(10);
  doc.setTextColor(cGray900[0], cGray900[1], cGray900[2]);
  doc.text(data.client.client_name, margin + 4, currentY + 9);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(cGray600[0], cGray600[1], cGray600[2]);
  let addrY = currentY + 13;
  if (data.client.address) {
    const splitAddr = doc.splitTextToSize(data.client.address, midCardW - 8);
    doc.text(splitAddr, margin + 4, addrY);
    addrY += (splitAddr.length * 3);
  }
  const clientCityState = `${[data.client.city, data.client.state].filter(Boolean).join(", ")}${data.client.pin ? ` - ${data.client.pin}` : ''}`;
  doc.text(clientCityState, margin + 4, addrY);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(cGray900[0], cGray900[1], cGray900[2]);
  doc.text(`GSTIN: ${data.client.gstin || 'N/A'}`, margin + 4, currentY + 23);

  // Quotation Card (Right)
  drawCard(margin + midCardW + 8, currentY, midCardW, midCardH, [255,255,255], cGray50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(cBlue800[0], cBlue800[1], cBlue800[2]);
  doc.text("Quotation", margin + midCardW + 12, currentY + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(cGray400[0], cGray400[1], cGray400[2]);
  doc.text("Quotation#", margin + midCardW + 12, currentY + 15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(cGray800[0], cGray800[1], cGray800[2]);
  doc.text(data.quoteNumber, pageWidth - margin - 4, currentY + 15, { align: 'right' });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(cGray400[0], cGray400[1], cGray400[2]);
  doc.text("Quotation Date", margin + midCardW + 12, currentY + 21);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(cGray800[0], cGray800[1], cGray800[2]);
  const dateFormatted = format(new Date(data.quoteDate), 'MMM dd, yyyy').toUpperCase();
  doc.text(dateFormatted, pageWidth - margin - 4, currentY + 21, { align: 'right' });

  currentY += midCardH + 6;

  // 3. Table
  const tableColumn = ["#", "ITEM DESCRIPTION", "HSN/SAC", "QTY.", "RATE", "TAX", "AMOUNT"];
  const tableRows: any[] = [];
  
  let totalQty = 0;
  let subTotal = 0;
  let totalTax = 0;
  
  data.items.forEach((item, index) => {
    totalQty += item.quantity;
    subTotal += (item.quantity * item.rate);
    totalTax += item.taxAmount;

    let desc = `${item.productName}`;
    if (item.description) {
      desc += ` - ${item.description}`; // single line with dash separator
    }
    
    let taxString = '';
    if (item.taxPercent > 0) {
      taxString = isKarnataka ? `GST@ ${item.taxPercent}%` : `IGST@ ${item.taxPercent}%`;
    }

    tableRows.push([
      (index + 1).toString(),
      desc,
      item.hsn,
      item.quantity.toString(),
      `Rs. ${formatAmount(item.rate)}`,
      taxString,
      `Rs. ${formatAmount(item.total)}`
    ]);
  });

  autoTable(doc, {
    startY: currentY,
    head: [tableColumn],
    body: tableRows,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: { 
      fontSize: 9, 
      font: "helvetica", 
      cellPadding: 1.5, 
      overflow: 'hidden'
    },
    headStyles: { 
      fillColor: cBlue700,
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      valign: 'middle',
      fontSize: 10,
      cellPadding: 2
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: cGray900,
      valign: 'top',
      fontStyle: 'normal',
      lineColor: cGray100,
      lineWidth: { bottom: 0.2 }
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 61, halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 28, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 'auto', halign: 'right' }
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY;

  // Calculate height for Totals Box
  let totalsCount = 3; // Subtotal, RoundOff, Total
  if (isKarnataka) totalsCount += 2; // CGST, SGST
  else totalsCount += 1; // IGST
  
  const totalsBoxHeight = (totalsCount * 9) + 5; 

  // Pagination check: if totals block will run off page, move to next page
  if (finalY + totalsBoxHeight > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    finalY = margin;
  }

  // 4. Totals (Full Width Grid Alignment)
  const totalsBoxWidth = pageWidth - (margin * 2);
  const totalsBoxX = margin;
  
  let totalsY = finalY;

  // Draw Totals Box as a gray continuation fill across the ENTIRE table width
  doc.setFillColor(cGray50[0], cGray50[1], cGray50[2]);
  doc.rect(totalsBoxX, totalsY, totalsBoxWidth, totalsBoxHeight, 'F');

  // --- Left Side: Total in Words ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(cGray400[0], cGray400[1], cGray400[2]);
  doc.text("TOTAL (IN WORDS)", totalsBoxX + 3, totalsY + 7); 
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(cGray800[0], cGray800[1], cGray800[2]);
  let totalWords = numberToWords(Math.round(subTotal + totalTax)); 
  totalWords = totalWords.charAt(0).toUpperCase() + totalWords.slice(1);
  const wordsLines = doc.splitTextToSize(`${totalWords} Rupees Only`, totalsBoxWidth - 90); 
  doc.text(wordsLines, totalsBoxX + 3, totalsY + 12);

  // --- Right Side: Financial Totals ---
  totalsY += 7;
  const labelX = pageWidth - margin - 45; // Moved further left to prevent overlap with large totals
  const valueX = pageWidth - margin - 3;  // Perfectly aligns with cellPadding 3 of Amount column
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9); 
  doc.setTextColor(cGray800[0], cGray800[1], cGray800[2]);
  
  doc.text("Sub Total", labelX, totalsY);
  doc.text(`${formatAmount(subTotal)}`, valueX, totalsY, { align: 'right' });
  
  totalsY += 8;

  if (isKarnataka) {
     doc.text("CGST", labelX, totalsY);
     doc.text(`${formatAmount(totalTax/2)}`, valueX, totalsY, { align: 'right' });
     totalsY += 8;
     doc.text("SGST", labelX, totalsY);
     doc.text(`${formatAmount(totalTax/2)}`, valueX, totalsY, { align: 'right' });
     totalsY += 8;
  } else {
     doc.text("IGST", labelX, totalsY);
     doc.text(`${formatAmount(totalTax)}`, valueX, totalsY, { align: 'right' });
     totalsY += 8;
  }
  
  const unroundedTotal = subTotal + totalTax;
  const roundedNet = Math.round(unroundedTotal);
  const roundOff = roundedNet - unroundedTotal;
  
  doc.text("Round Off", labelX, totalsY);
  const roundOffPrefix = roundOff >= 0 ? '+' : '';
  doc.text(`${roundOffPrefix}${formatAmount(roundOff)}`, valueX, totalsY, { align: 'right' });

  totalsY += 5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(labelX - 5, totalsY, pageWidth - margin, totalsY);
  
  totalsY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12); 
  doc.setTextColor(cBlue700[0], cBlue700[1], cBlue700[2]);
  doc.text("Total", labelX, totalsY);
  doc.text(`Rs. ${formatAmount(roundedNet)}`, valueX, totalsY, { align: 'right' });

  finalY = totalsY + 12;

  // 5. Terms & Conditions Box
  if (finalY > 255) {
    doc.addPage();
    finalY = margin;
  }

  drawCard(margin, finalY, pageWidth - (margin*2), 38, cGray50, cGray100);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(cBlue700[0], cBlue700[1], cBlue700[2]);
  doc.text("Terms and Conditions", margin + 5, finalY + 5);
  
  let termsY = finalY + 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(cGray600[0], cGray600[1], cGray600[2]);
  
  let termsArray: string[] = [];
  if (data.terms && typeof data.terms === 'object' && !Array.isArray(data.terms)) {
    if (data.terms.order_payment) termsArray.push(`1. Order / Payment : ${data.terms.order_payment}`);
    if (data.terms.taxes) termsArray.push(`2. Taxes : ${data.terms.taxes}`);
    if (data.terms.warranty) termsArray.push(`3. Warranty : ${data.terms.warranty}`);
    if (data.terms.payment_for_supply) termsArray.push(`4. Payment : ${data.terms.payment_for_supply}`);
    if (data.terms.delivery) termsArray.push(`5. Delivery : ${data.terms.delivery}`);
    if (data.terms.validity) termsArray.push(`6. Validity : ${data.terms.validity}`);
  } else if (data.terms && typeof data.terms === 'string' && data.terms.trim() !== '') {
    termsArray = data.terms.split('\n').filter(t => t.trim() !== '');
  } else if (Array.isArray(data.terms) && data.terms.length > 0) {
    termsArray = data.terms;
  } else {
    termsArray = [
      `1. Order / Payment : In favour of Hertz & Bytes Technologies, Bangalore.`,
      `2. Taxes : As per applicable GST.`,
      `3. Warranty : 1 Year OEM Warranty.`,
      `4. Payment : 100% advance along with purchase order.`,
      `5. Delivery : Within 2-3 weeks from the date of receipt of PO & Payment.`,
      `6. Validity : 30 Days from the date of quotation.`
    ];
  }

  termsArray.forEach(term => {
     doc.text(term, margin + 5, termsY);
     termsY += 4.2;
  });

  // Signatory text on bottom right of terms box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cMaroon[0], cMaroon[1], cMaroon[2]);
  doc.text("Hertz & Bytes Technologies", pageWidth - margin - 5, finalY + 9, { align: 'right' });
  
  const companyNameWidth = doc.getTextWidth("Hertz & Bytes Technologies");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(cGray600[0], cGray600[1], cGray600[2]);
  doc.text("For ", pageWidth - margin - 5 - companyNameWidth, finalY + 9, { align: 'right' });
  
  doc.text("Authorized Signatory", pageWidth - margin - 5, finalY + 33, { align: 'right' });

  if (action === 'preview') {
    return doc.output('bloburl');
  }

  // Output
  doc.save(`${data.quoteNumber}.pdf`);
};
