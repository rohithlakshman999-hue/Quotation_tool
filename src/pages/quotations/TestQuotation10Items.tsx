import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { generateQuotationPDF } from '../../lib/pdfGenerator';
import type { Client } from '../../types/database';

export const TestQuotation10Items: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const testClient: Client = {
    id: 'test-1',
    client_name: 'Fin Corp',
    address: 'ABC Nagar',
    city: 'Hosur',
    state: 'Tamil Nadu',
    pin: '590220',
    gstin: 'ABC2781299YG',
    account_manager: 'John',
    user_id: 'test-user',
    created_at: new Date().toISOString()
  };

  const generateSample = (action: 'save' | 'preview') => {
    setLoading(true);
    try {
      const pdfData = {
        quoteNumber: 'QT-2026-1663',
        quoteDate: '2026-05-30',
        client: testClient,
        items: [
          {
            productName: 'Wireless Mouse',
            description: 'Compact wireless mouse with USB receiver',
            hsn: '8622',
            quantity: 1,
            uom: 'pcs',
            rate: 1000.00,
            taxPercent: 18,
            taxAmount: 180.00,
            total: 1180.00,
          },
          {
            productName: 'Wireless Mouse',
            description: 'Compact wireless mouse with USB receiver',
            hsn: '8622',
            quantity: 2,
            uom: 'pcs',
            rate: 900.00,
            taxPercent: 5,
            taxAmount: 90.00,
            total: 1890.00,
          },
          {
            productName: 'USB Keyboard',
            description: 'Standard USB keyboard',
            hsn: '8471',
            quantity: 3,
            uom: 'pcs',
            rate: 500.00,
            taxPercent: 18,
            taxAmount: 270.00,
            total: 1770.00,
          },
          {
            productName: 'Monitor Stand',
            description: 'Adjustable monitor stand',
            hsn: '7326',
            quantity: 1,
            uom: 'pcs',
            rate: 2000.00,
            taxPercent: 18,
            taxAmount: 360.00,
            total: 2360.00,
          },
          {
            productName: 'USB Hub',
            description: '4-port USB 3.0 hub',
            hsn: '8471',
            quantity: 2,
            uom: 'pcs',
            rate: 800.00,
            taxPercent: 18,
            taxAmount: 288.00,
            total: 2176.00,
          },
          {
            productName: 'HDMI Cable',
            description: '2m HDMI 2.0 cable',
            hsn: '8544',
            quantity: 5,
            uom: 'pcs',
            rate: 300.00,
            taxPercent: 12,
            taxAmount: 180.00,
            total: 1680.00,
          },
          {
            productName: 'Webcam',
            description: '1080p HD webcam with microphone',
            hsn: '8525',
            quantity: 1,
            uom: 'pcs',
            rate: 3000.00,
            taxPercent: 18,
            taxAmount: 540.00,
            total: 3540.00,
          },
          {
            productName: 'Mousepad',
            description: 'Large rubber mousepad',
            hsn: '4820',
            quantity: 4,
            uom: 'pcs',
            rate: 200.00,
            taxPercent: 18,
            taxAmount: 144.00,
            total: 944.00,
          },
          {
            productName: 'Screen Protector',
            description: 'Anti-glare screen protector',
            hsn: '7007',
            quantity: 2,
            uom: 'pcs',
            rate: 500.00,
            taxPercent: 12,
            taxAmount: 120.00,
            total: 1220.00,
          },
          {
            productName: 'USB-C Dock',
            description: 'USB-C docking station with HDMI',
            hsn: '8471',
            quantity: 1,
            uom: 'pcs',
            rate: 4500.00,
            taxPercent: 18,
            taxAmount: 810.00,
            total: 5310.00,
          },
        ],
        netAmount: 21170.00,
        terms: {
          order_payment: "In favour of Hertz & Bytes Technologies, Bangalore.",
          taxes: "As per applicable GST.",
          payment_for_supply: "100% advance along with purchase order.",
          delivery: "Within 2-3 weeks from the date of receipt of PO & Payment.",
          warranty: "1 Year OEM Warranty.",
          validity: "30 Days from the date of quotation."
        }
      };

      generateQuotationPDF(pdfData, action);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test: 10 Products on Single Page</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Sample Quotation Details</h2>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Quote Number: QT-2026-1663</li>
            <li>✓ Customer: Fin Corp (Hosur, Tamil Nadu)</li>
            <li>✓ Total Items: 10 products</li>
            <li>✓ Total Quantity: 22 units</li>
            <li>✓ Net Amount: ₹21,170.00</li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Click the button below to generate a PDF with 10 different products. 
            The PDF should fit everything on a single page with proper formatting.
          </p>

          <div className="flex gap-4">
            <Button 
              onClick={() => generateSample('preview')} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Generating...' : 'Preview PDF'}
            </Button>
            
            <Button 
              onClick={() => generateSample('save')} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded text-sm text-gray-700">
          <strong>Note:</strong> This test generates a quotation with exactly 10 products 
          at various quantities and tax rates. The PDF is optimized to fit everything 
          on a single page including headers, items table, totals, and terms section.
        </div>
      </div>
    </div>
  );
};
