import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Helper function to convert number to words
function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let numStr = num.toString();
  if (numStr.length > 9) return 'overflow';
  const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != "00") ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (n[2] != "00") ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (n[3] != "00") ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (n[4] != "0") ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (n[5] != "00") ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  return str.trim();
}

export function generateQuotationPDF(data: any, action: 'save' | 'view' = 'save') {
  const doc = new jsPDF()
  
  // Default Settings
  let companySettings = {
    companyName: "Hertz & Bytes Technologies",
    address: "#68, 1st Floor, Near to S.B.T, Above Karnataka Bank, B.C.R. Complex, Electronic City Post, Bangalore-560100",
    phone: "080-28522300, 28522301",
    email: "sales@hertzbytes.com",
    gstin: "29AADCH1234E1Z5"
  }
  const savedSettings = localStorage.getItem("company_settings")
  if (savedSettings) {
    companySettings = JSON.parse(savedSettings)
  }

  // --- Header ---
  // Company Logo (Placeholder for now since we don't have the image file, drawing a circle to represent it)
  doc.setDrawColor(200, 50, 50)
  doc.circle(30, 20, 10, 'S')
  doc.setFontSize(10)
  doc.text("HB", 27, 21)

  // Company Name & Details
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text(companySettings.companyName, 105, 15, { align: "center" })
  
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(companySettings.address, 105, 20, { align: "center" })
  doc.text(`Phone No: ${companySettings.phone} Email: ${companySettings.email}`, 105, 24, { align: "center" })
  
  doc.setFont("helvetica", "bold")
  doc.text(`GSTIN - ${companySettings.gstin}`, 105, 28, { align: "center" }) 
  
  // --- Divider Line ---
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(14, 40, 182, 35) // Outer box for Client info & Quote info
  doc.line(14, 50, 196, 50) // line below To/Quotation
  doc.line(120, 40, 120, 75) // vertical line splitting client/quote info

  // --- Client Details (Left Side) ---
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("To:", 16, 47)
  doc.text(data.clientName, 16, 55)
  
  doc.setFont("helvetica", "normal")
  doc.text(data.clientCity, 16, 62)
  doc.text(data.clientState, 16, 69)

  // --- Quotation Details (Right Side) ---
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Quotation", 165, 47)
  
  doc.setFontSize(10)
  doc.text(`Quotation No: ${data.quoteNo}`, 125, 58)
  doc.text(`Dated: ${data.quoteDate}`, 155, 65)

  // --- Items Table ---
  const tableColumn = ["#", "Description", "HSN/SAC", "Qty", "Rate", "Tax", "Amount"]
  const tableRows: any[] = []

  let totalQty = 0

  data.items.forEach((item: any, index: number) => {
    // Handling multi-line description
    tableRows.push([
      (index + 1).toString(),
      item.description, // autoTable handles newlines
      item.hsn_sac,
      `${item.qty.toFixed(2)} ${item.uom}`,
      item.rate.toFixed(2),
      item.tax_desc,
      (item.qty * item.rate).toFixed(2)
    ])
    totalQty += item.qty
  })

  // Add Summary Rows inside the table
  tableRows.push([
    "", { content: "Sub Total", styles: { halign: 'right', fontStyle: 'bold' } }, "", "", "", "", data.subTotal.toFixed(2)
  ])
  tableRows.push([
    "", { content: "Discount", styles: { halign: 'right', fontStyle: 'bold' } }, "", "", "", "", data.discount.toFixed(2)
  ])
  tableRows.push([
    "", { content: "IGST@18%", styles: { halign: 'right', fontStyle: 'bold' } }, "", "", "", "", data.totalTax.toFixed(2)
  ])
  tableRows.push([
    "", { content: "Round Off", styles: { halign: 'right', fontStyle: 'bold' } }, "", "", "", "", data.roundOff.toFixed(2)
  ])
  
  // Final Total Row
  tableRows.push([
    "", { content: "Total", styles: { halign: 'left', fontStyle: 'bold' } }, "", { content: totalQty.toFixed(2), styles: { halign: 'left', fontStyle: 'bold' } }, "", "", { content: `Rs.${data.finalTotal.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
  ])

  autoTable(doc, {
    startY: 75,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold'
    },
    styles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      fontSize: 9,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' }, // #
      1: { cellWidth: 55, halign: 'left' }, // Description
      2: { cellWidth: 22, halign: 'center' }, // HSN/SAC
      3: { cellWidth: 18, halign: 'center' }, // Qty
      4: { cellWidth: 22, halign: 'center' }, // Rate
      5: { cellWidth: 22, halign: 'center' }, // Tax
      6: { cellWidth: 25, halign: 'center' }, // Amount
    },
    didParseCell: function (data) {
      // Bold the last row (Total)
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  // --- Footer Section ---
  const finalY = (doc as any).lastAutoTable.finalY + 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Amount (in words) : Rs. ${numberToWords(data.finalTotal)} Only`, 14, finalY)

  // Terms & Conditions
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Terms & Condition:", 14, finalY + 15)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  const terms = [
    "1. Order / Payment : In favour of Hertz & Bytes Technologies, Bangalore",
    "2. Taxes : Prices are Inclusive of all Taxes",
    "3. Warranty : As per the manufacturers Warranty",
    "4. Payment : 50% Advance along with PO and 50% Against Delivery",
    "5. Delivery : Back to Back",
    "6. Validity : 3 Days"
  ]
  
  let currentY = finalY + 20
  terms.forEach(term => {
    // Word wrap the terms
    const splitText = doc.splitTextToSize(term, 100)
    doc.text(splitText, 14, currentY)
    currentY += 5 * splitText.length
  })

  // Signature Block
  doc.setFont("helvetica", "bold")
  doc.text("For Hertz & Bytes Technologies,", 130, finalY + 25)
  
  doc.setFont("helvetica", "normal")
  doc.text("Authorized Signatory", 150, finalY + 50)

  // Save or return
  if (action === 'save') {
    doc.save(`Quotation_${data.quoteNo.replace(/\//g, '_')}.pdf`)
  } else if (action === 'view') {
    const blob = doc.output("blob")
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }
}
