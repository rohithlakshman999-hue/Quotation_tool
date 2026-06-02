import html2pdf from 'html2pdf.js';
import type { Client } from '../types/database';
import { format } from 'date-fns';
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

const formatAmount = (num: number) => {
  return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const isKarnataka = (state: string) => (state || "").toLowerCase().includes("karnataka");

export const generateHTMLQuotationPDF = async (data: PDFQuotationData, action: 'save' | 'preview' = 'save') => {
  // Calculate totals
  let subTotal = 0;
  let totalTax = 0;
  
  data.items.forEach(item => {
    subTotal += (item.quantity * item.rate);
    totalTax += item.taxAmount;
  });

  const unroundedTotal = subTotal + totalTax;
  const roundedNet = Math.round(unroundedTotal);
  const roundOff = roundedNet - unroundedTotal;
  const roundOffPrefix = roundOff >= 0 ? '+' : '';

  // Generate items table rows
  const itemsRows = data.items.map((item, index) => {
    let taxString = '';
    if (item.taxPercent > 0) {
      taxString = isKarnataka(data.client.state) ? `GST@ ${item.taxPercent}%` : `IGST@ ${item.taxPercent}%`;
    }

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 font-medium py-2 font-bold">${index + 1}. ${item.productName}</td>
        <td class="px-4 py-2 text-center font-bold">${item.hsn}</td>
        <td class="px-4 text-center py-2 font-bold">${item.quantity}</td>
        <td class="px-4 text-right py-2 font-bold">Rs. ${formatAmount(item.rate)}</td>
        <td class="px-4 text-center py-2 font-bold">${taxString}</td>
        <td class="px-4 text-right font-medium py-2 font-bold">Rs. ${formatAmount(item.total)}</td>
      </tr>
    `;
  }).join('');

  // Generate terms list
  const termsList = `
    <li class="">Order / Payment : In favour of Hertz & Bytes Technologies, Bangalore.&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; For <span class="font-bold">Hertz & Bytes Technologies</span></li>
    <li class="">Taxes : As per applicable GST.</li>
    <li class="">Warranty : 1 Year OEM Warranty.</li>
    <li class="">Payment : 100% advance along with purchase order.</li>
    <li class="">Delivery : Within 2-3 weeks from the date of receipt of PO & Payment.&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Authorized Signatory</li>
    <li class="">Validity : 30 Days from the date of quotation.</li>
  `;

  // Total in words
  let totalWords = numberToWords(roundedNet);
  totalWords = totalWords.charAt(0).toUpperCase() + totalWords.slice(1);

  // Generate tax label
  const taxLabel = isKarnataka(data.client.state) ? 'CGST/SGST' : 'IGST';

  // HTML template
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Quotation - ${data.quoteNumber}</title>
<!-- Tailwind CSS v3 CDN -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      color: #374151;
    }
    .quotation-container {
      max-width: 800px;
      margin: 2rem auto;
      background-color: white;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      min-height: 1000px;
      display: flex;
      flex-direction: column;
    }
    @media print {
      body { background-color: white; }
      .quotation-container {
        box-shadow: none;
        margin: 0;
        width: 100%;
      }
    }
  </style>
</head>
<body class="bg-gray-100 p-4 sm:p-8">
<div class="quotation-container relative px-6 pb-6 pt-0" style="max-width: 800px; margin: 0.25rem auto; background-color: white; box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px; min-height: 1000px; display: flex; flex-direction: column;">
<!-- Header -->
<header class="flex justify-end items-start mb-1">
<div class="flex justify-between items-start w-full">
<div class="h-auto w-32">
<img alt="Hertz & Bytes Technologies Logo" class="w-full h-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnKzWuVqGOeEVZhqaFepxAdDPcF75tcBeMMGuQWup3dDuMX7s_9QSl5BSCDM9wzIfqyKBQkuqjLJQWvR3JFUZBoebYVZoXiNIL5dmZegsxUnHMHbARNDQ5dargEAwTFknriLaFPJ-gxX90o9isPX-MIVwk7ON_o8jpGL1rlTyVl0oOIVJ83THtCBQSufyDDPAGzmFq7scTSljb5_hmFR6i-d_7T4uxcnCUF2oQBNfzapnP9Ul_Kd3bkvG1FJkaMhquMY68T-iHBPs">
</div>
<div class="bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm p-4 max-w-md w-full text-right">
<h3 class="text-lg font-bold mb-1 leading-tight" style="color: rgb(145, 39, 35);">Hertz & Bytes Technologies</h3>
<address class="not-italic text-xs text-gray-600 leading-relaxed">
  96, 6th Cross, Venkatadri Lake View, Hosa Road, Parappana Agrahara, Bangalore, Karnataka, 560100
</address>
<div class="mt-2 inline-block px-0 py-1 text-xs text-gray-600">
  <span class="font-bold">GSTIN: 29AJGPG7739M1ZJ</span>
</div>
<div class="mt-1 text-xs text-gray-600 space-y-0.5">
  <p class="">ganesan@hertznbytes.com&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; +91 8892070585</p>
</div>
</div>
</div>
</header>

<!-- Info Cards Section -->
<section class="grid grid-cols-1 gap-4 md:grid-cols-2 items-stretch mb-2">
<!-- Quotation To -->
<div class="bg-gray-50 rounded-xl border border-gray-100 shadow-sm p-3">
<h3 class="text-lg font-bold text-gray-900 mb-0">
<span class="text-sm font-bold text-gray-500 block mb-1">To</span>
<div class="text-lg font-bold text-gray-900">${data.client.client_name}</div>
</h3>
<address class="not-italic text-gray-600 text-xs mb-1 leading-relaxed">
  ${data.client.address || ''}<br>
  ${[data.client.city, data.client.state].filter(Boolean).join(', ')}${data.client.pin ? ` - ${data.client.pin}` : ''}
</address>
<p class="text-xs text-gray-600">
<span class="font-bold uppercase">GSTIN:</span> <span class="text-gray-900 font-medium">${data.client.gstin || 'N/A'}</span>
</p>
</div>

<!-- Quotation Details -->
<div class="bg-white rounded-xl border border-gray-50 shadow-sm flex flex-col justify-start p-3">
<h1 class="text-3xl font-bold text-blue-800 tracking-tight mb-2">Quotation</h1>
<div class="space-y-2">
<div class="flex justify-between text-xs">
<span class="text-gray-400">Quotation#</span>
<span class="font-bold text-gray-800 ml-4">${data.quoteNumber}</span>
</div>
<div class="flex justify-between text-xs">
<span class="text-gray-400">Quotation Date</span>
<span class="font-bold text-gray-800 ml-4 uppercase">${format(new Date(data.quoteDate), 'MMM dd, yyyy').toUpperCase()}</span>
</div>
</div>
</div>
</section>

<!-- Items Table -->
<main class="mb-4">
<table class="w-full border-collapse text-[11px]" id="quotation-table">
<thead>
<tr class="bg-blue-700 text-white text-left uppercase tracking-wider text-xs">
<th class="px-4 font-semibold rounded-tl-lg py-2 text-left">#&nbsp; Item description</th>
<th class="px-4 font-semibold py-2 text-left">HSN/SAC</th>
<th class="px-4 font-semibold text-center py-2">Qty.</th>
<th class="px-4 font-semibold py-2 text-center">Rate</th>
<th class="px-4 font-semibold py-2 text-center">Tax</th>
<th class="px-4 font-semibold rounded-tr-lg py-2 text-center">Amount</th>
</tr>
</thead>
<tbody class="text-sm divide-y divide-gray-100">
${itemsRows}
</tbody>
</table>
</main>

<!-- Summary Section -->
<section class="grid-cols-1 gap-8 mb-6 flex justify-end">
<!-- Financial Calculations -->
<div class="space-y-1 ml-auto w-full max-w-[280px]">
<div class="flex justify-between text-sm">
<span class="text-gray-500 font-bold">Sub Total</span>
<span class="font-medium font-bold">${formatAmount(subTotal)}</span>
</div>
<div class="flex justify-between text-sm">
<span class="text-gray-500 font-bold">${taxLabel}</span>
<span class="font-medium font-bold">${formatAmount(totalTax)}</span>
</div>
<div class="flex justify-between text-sm pb-3 border-b border-gray-200">
<span class="text-gray-500 font-bold">Round Off</span>
<span class="font-medium font-bold">${roundOffPrefix}${formatAmount(roundOff)}</span>
</div>
<div class="flex justify-between items-center bg-blue-50 rounded-lg p-2">
<span class="text-lg font-bold text-blue-800">Total</span>
<span class="text-xl font-extrabold text-blue-700">Rs. ${formatAmount(roundedNet)}</span>
</div>
<div class="pt-4">
<p class="text-[10px] uppercase text-gray-400 font-bold mb-1">Total (in words)</p>
<p class="text-sm font-bold text-gray-800">Rs. ${totalWords} Only Rupees Only</p>
</div>
</div>

<div class="mt-12 flex justify-end">
<div class="w-full max-w-[280px] text-center">
<div class="border-t border-gray-400 pt-2">
</div>
</div>
</div>
</section>

<div class="bg-gray-50/50 p-4 rounded-lg border border-gray-100 mt-6">
<h4 class="text-blue-700 font-bold border-b border-blue-100 pb-2 mb-2">Terms and Conditions</h4>
<ol class="text-xs text-gray-600 space-y-2 list-decimal ml-4 leading-relaxed w-full">
${termsList}
</ol>
</div>

<footer class="mt-auto pt-8 pb-4">
</footer>
</div>
</body>
</html>
  `;

  // Create a temporary container to render the HTML
  const container = document.createElement('div');
  container.innerHTML = htmlTemplate;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  try {
    // Configure html2pdf options
    const opt = {
      margin: 0,
      filename: `${data.quoteNumber}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const 
      }
    };

    if (action === 'preview') {
      const pdfBlob = await html2pdf().set(opt).from(container).toPdf().get('pdf').then((pdf: any) => {
        return pdf.output('bloburl');
      });
      document.body.removeChild(container);
      return pdfBlob;
    } else {
      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      return null;
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    document.body.removeChild(container);
    throw error;
  }
};
