import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Client, Product, GSTRate } from '../../types/database';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Trash2, Save, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { generateHTMLQuotationPDF } from '../../lib/htmlPdfGenerator';
import Select from 'react-select';
import { ConfirmDeleteDialog } from '../../components/ui/confirm-delete-dialog';

interface LineItem {
  id: string;
  product_id: string;
  gst_id: string;
  quantity: number;
  unit_rate: number;
  tax_percent: number;
  tax: number;
  total_amount: number;
  description: string;
}

const defaultTerms = {
  order_payment: "In favour of Hertz & Bytes Technologies, Bangalore",
  taxes: "Prices are Inclusive of all Taxes",
  payment_for_supply: "Within 30 Days From the Date of Invoice",
  delivery: "Back to Back",
  warranty: "As per the manufacturers Warranty",
  validity: "3 Days"
};

const createEmptyItem = (): LineItem => ({
  id: crypto.randomUUID(),
  product_id: '',
  gst_id: '',
  quantity: 1,
  unit_rate: 0,
  tax_percent: 0,
  tax: 0,
  total_amount: 0,
  description: ''
});

export const QuotationForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [gstRates, setGstRates] = useState<GSTRate[]>([]);

  const [quoteNumber, setQuoteNumber] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [terms, setTerms] = useState(defaultTerms);
  const [status, setStatus] = useState<'pending' | 'won' | 'lost'>('pending');

  useEffect(() => {
    fetchLookups();
  }, [id]);

  const fetchLookups = async () => {
    try {
      setFetching(true);

      let clientData: Client[] = [];
      let productData: Product[] = [];
      let gstData: GSTRate[] = [];

      if (isSupabaseConfigured) {
        const [clientRes, productRes, gstRes] = await Promise.all([
          supabase.from('clients').select('*').order('client_name'),
          supabase.from('products').select('*, gst_rate:gst_rates(*), unit:units(*)').order('product_name'),
          supabase.from('gst_rates').select('*').order('gst_percentage')
        ]);
        clientData = clientRes.data || [];
        productData = productRes.data || [];
        gstData = gstRes.data || [];
      } else {
        try {
          const savedClients = localStorage.getItem('demo_clients');
          if (savedClients) clientData = JSON.parse(savedClients);

          const savedProducts = localStorage.getItem('demo_products');
          if (savedProducts) productData = JSON.parse(savedProducts);
          
          const savedGst = localStorage.getItem('demo_gst_rates');
          if (savedGst) gstData = JSON.parse(savedGst);
        } catch { /* ignore */ }
      }

      setClients(clientData);
      setProducts(productData);
      setGstRates(gstData);

      if (id) {
        if (isSupabaseConfigured) {
          const { data: quote, error: quoteErr } = await supabase
            .from('quotations')
            .select('*, items:quotation_items(*)')
            .eq('id', id)
            .single();
          
          if (quoteErr) throw quoteErr;
          
          if (quote) {
            setQuoteNumber(quote.quote_number);
            setQuoteDate(quote.quote_date.split('T')[0]);
            setClientId(quote.client_id);
            setTerms(quote.terms_conditions || defaultTerms);
            setStatus(quote.status || 'pending');
            
            if (quote.items) {
              const mappedItems = quote.items.map((i: any) => {
                const product = productData.find(p => p.id === i.product_id);
                // We default to the product's gst if the item doesn't store it explicitly, 
                // but since we compute tax_percent, we can just infer the gst_id.
                const gst = gstData.find(g => g.gst_percentage === (i.tax_percent || (product?.gst_rate?.gst_percentage || 0)));
                return {
                  id: i.id,
                  product_id: i.product_id,
                  gst_id: gst?.id || product?.gst_id || '',
                  quantity: i.quantity,
                  unit_rate: i.unit_rate,
                  tax_percent: gst?.gst_percentage || 0,
                  tax: i.tax,
                  total_amount: i.total_amount,
                  description: i.description || ''
                };
              });
              setItems(mappedItems);
            }
          }
        } else {
          try {
            const savedQuotations = localStorage.getItem('demo_quotations');
            if (savedQuotations) {
              const quotations = JSON.parse(savedQuotations);
              const quote = quotations.find((q: any) => q.id === id);
              if (quote) {
                setQuoteNumber(quote.quote_number);
                setQuoteDate(quote.quote_date);
                setClientId(quote.client_id);
                setTerms(quote.terms_conditions || defaultTerms);
                setStatus(quote.status || 'pending');

                const savedItems = localStorage.getItem(`demo_items_${id}`);
                if (savedItems) {
                  setItems(JSON.parse(savedItems));
                } else {
                  setItems([createEmptyItem()]);
                }
              }
            }
          } catch { /* ignore */ }
        }
      } else {
        let nextQuoteNum = "HNBT/2526/001";
        try {
          if (isSupabaseConfigured) {
            const { data: lastQuote } = await supabase
              .from('quotations')
              .select('quote_number')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (lastQuote && lastQuote.quote_number) {
              const match = lastQuote.quote_number.match(/(HNBT\/\d{4}\/)(\d+)/);
              if (match && match[1] && match[2]) {
                const nextNum = parseInt(match[2], 10) + 1;
                nextQuoteNum = `${match[1]}${nextNum.toString().padStart(3, '0')}`;
              }
            }
          } else {
            const savedQuotations = localStorage.getItem('demo_quotations');
            if (savedQuotations) {
              const quotations = JSON.parse(savedQuotations);
              if (quotations.length > 0) {
                // Find the first one that matches the pattern (assuming array is prepended/sorted newest first)
                const lastQuote = quotations.find((q: any) => q.quote_number?.match(/HNBT\/\d{4}\/\d+/));
                if (lastQuote) {
                  const match = lastQuote.quote_number.match(/(HNBT\/\d{4}\/)(\d+)/);
                  if (match && match[1] && match[2]) {
                    const nextNum = parseInt(match[2], 10) + 1;
                    nextQuoteNum = `${match[1]}${nextNum.toString().padStart(3, '0')}`;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Error generating next quote number", e);
        }

        setQuoteNumber(nextQuoteNum);
        setItems([createEmptyItem()]);
      }
    } catch (error: any) {
      toast.error('Error fetching data', { description: error.message });
      setQuoteNumber('HNBT/2526/001');
      setItems([createEmptyItem()]);
    } finally {
      setFetching(false);
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
  };

  const confirmRemoveItem = (idToRemove: string) => {
    setDeleteItemId(idToRemove);
  };

  const performRemoveItem = async () => {
    if (!deleteItemId) return;
    setItems(prev => prev.filter(item => item.id !== deleteItemId));
    setDeleteItemId(null);
  };

  const calculateLineItem = (item: LineItem): LineItem => {
    const itemTotal = item.quantity * item.unit_rate;
    const taxAmount = (itemTotal * item.tax_percent) / 100;
    return {
      ...item,
      tax: taxAmount,
      total_amount: itemTotal
    };
  };

  const updateItem = (itemId: string, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        let updatedItem = { ...item, [field]: value };
        
        if (field === 'product_id') {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.gst_id = product.gst_id || '';
            if (product.gst_rate) {
              updatedItem.tax_percent = product.gst_rate.gst_percentage;
            } else {
              const gst = gstRates.find(g => g.id === product.gst_id);
              updatedItem.tax_percent = gst?.gst_percentage || 0;
            }
          }
        }
        
        if (field === 'gst_id') {
          const gst = gstRates.find(g => g.id === value);
          updatedItem.tax_percent = gst?.gst_percentage || 0;
        }
        
        return calculateLineItem(updatedItem);
      }
      return item;
    }));
  };

  const handleTermChange = (field: keyof typeof defaultTerms, value: string) => {
    setTerms({ ...terms, [field]: value });
  };

  const totalItemAmount = items.reduce((sum, item) => sum + item.total_amount, 0);
  const totalTaxAmount = items.reduce((sum, item) => sum + item.tax, 0);
  const netAmount = totalItemAmount + totalTaxAmount;

  const buildPdfData = () => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (!selectedClient) return null;

    const pdfItems = items.map(item => {
      const p = products.find(prod => prod.id === item.product_id);
      return {
        productName: p?.product_name || item.description || 'Item',
        description: item.description,
        hsn: p?.hsn || '',
        quantity: item.quantity,
        uom: p?.unit?.symbol || '',
        rate: item.unit_rate,
        taxPercent: item.tax_percent,
        taxAmount: item.tax,
        total: item.total_amount
      };
    });

    return {
      quoteNumber,
      quoteDate,
      client: selectedClient,
      items: pdfItems,
      netAmount,
      terms
    };
  };

  const handleSave = async (generatePdf = false) => {
    if (!clientId) {
      toast.error('Please select a client');
      return;
    }
    if (items.length === 0 || !items[0].product_id) {
      toast.error('Please add at least one valid item');
      return;
    }

    let pdfWindow: Window | null = null;
    if (generatePdf) {
      // Open the window immediately to bypass popup blockers
      pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write('<html><body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8fafc;"><h2>Generating your PDF...</h2></body></html>');
      } else {
        toast.warning('Please allow popups for this site to view the PDF');
      }
    }

    try {
      setLoading(true);

      if (!isSupabaseConfigured) {
        const selectedClient = clients.find(c => c.id === clientId);
        const quoteId = id || crypto.randomUUID();

        const quoteObj = {
          id: quoteId,
          user_id: 'demo',
          quote_number: quoteNumber,
          quote_date: quoteDate,
          client_id: clientId,
          net_amount: netAmount,
          terms_conditions: terms,
          status: status,
          created_at: new Date().toISOString(),
          client: selectedClient || null
        };

        let quotations: any[] = [];
        try {
          const saved = localStorage.getItem('demo_quotations');
          if (saved) quotations = JSON.parse(saved);
        } catch { /* ignore */ }

        if (id) {
          quotations = quotations.map(q => q.id === id ? quoteObj : q);
        } else {
          quotations.unshift(quoteObj);
        }
        localStorage.setItem('demo_quotations', JSON.stringify(quotations));
        localStorage.setItem(`demo_items_${quoteId}`, JSON.stringify(items));

        toast.success(id ? 'Quotation updated successfully' : 'Quotation created successfully');

        if (generatePdf) {
          const pdfData = buildPdfData();
          if (pdfData) {
            const url = await generateHTMLQuotationPDF(pdfData, 'preview');
            if (url && pdfWindow) {
              pdfWindow.location.href = url.toString();
            } else if (pdfWindow) {
              pdfWindow.close();
            }
          } else if (pdfWindow) {
            pdfWindow.close();
          }
        }

        navigate('/quotations');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id || '';

      const quotePayload = {
        quote_number: quoteNumber,
        quote_date: quoteDate,
        client_id: clientId,
        net_amount: netAmount,
        terms_conditions: terms,
        status: status,
        user_id: user_id
      };

      let currentQuoteId = id;

      if (id) {
        const { error: hErr } = await supabase.from('quotations').update(quotePayload).eq('id', id);
        if (hErr) throw hErr;
        
        await supabase.from('quotation_items').delete().eq('quotation_id', id);
        
        const itemsPayload = items.map(item => ({
          quotation_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_rate: item.unit_rate,
          tax: item.tax,
          total_amount: item.total_amount,
          description: item.description
        }));
        
        const { error: iErr } = await supabase.from('quotation_items').insert(itemsPayload);
        if (iErr) throw iErr;

        toast.success('Quotation updated successfully');
      } else {
        const { data: qData, error: hErr } = await supabase.from('quotations').insert([quotePayload]).select().single();
        if (hErr) throw hErr;
        
        currentQuoteId = qData?.id;

        if (currentQuoteId) {
          const itemsPayload = items.map(item => ({
            quotation_id: currentQuoteId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_rate: item.unit_rate,
            tax: item.tax,
            total_amount: item.total_amount,
            description: item.description
          }));
          
          const { error: iErr } = await supabase.from('quotation_items').insert(itemsPayload);
          if (iErr) throw iErr;
        }

        toast.success('Quotation created successfully');
      }

      if (generatePdf) {
        const pdfData = buildPdfData();
        if (pdfData) {
          const url = await generateHTMLQuotationPDF(pdfData, 'preview');
          if (url && pdfWindow) {
            pdfWindow.location.href = url.toString();
          } else if (pdfWindow) {
            pdfWindow.close();
          }
        } else if (pdfWindow) {
          pdfWindow.close();
        }
      }

      navigate('/quotations');
    } catch (error: any) {
      if (pdfWindow) pdfWindow.close();
      toast.error('Error saving quotation', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-pulse text-slate-400 text-lg">Loading quotation...</div>
      </div>
    );
  }

  const clientOptions = clients.map(c => ({ value: c.id, label: c.client_name }));
  const selectedClientOption = clientOptions.find(opt => opt.value === clientId) || null;

  const productOptions = products.map(p => ({ value: p.id, label: p.product_name }));

  return (
    <div className="space-y-6 pb-20">
      <ConfirmDeleteDialog
        isOpen={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        onConfirm={performRemoveItem}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {id ? 'Edit Quotation' : 'Create New Quotation'}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button variant="outline" className="w-full sm:w-auto h-12 md:h-10" onClick={() => navigate('/quotations')}>Cancel</Button>
          <Button variant="outline" className="w-full sm:w-auto h-12 md:h-10 bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleSave(true)} disabled={loading}>
            <Printer className="w-4 h-4 mr-2" />
            Save & View PDF
          </Button>
          <Button className="w-full sm:w-auto h-12 md:h-10 bg-blue-600 hover:bg-blue-700" onClick={() => handleSave(false)} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Quotation
          </Button>
        </div>
      </div>

      {clients.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠️ No clients found. Please add clients in the <strong>Client Master</strong> first before creating a quotation.
        </div>
      )}

      {products.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠️ No products found. Please add products in the <strong>Product Master</strong> first before creating a quotation.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg">Header Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="quoteNumber">Quote Number</Label>
              <Input id="quoteNumber" className="h-12 md:h-10" value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteDate">Quote Date</Label>
              <Input id="quoteDate" type="date" className="h-12 md:h-10" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <Select
                options={clientOptions}
                value={selectedClientOption}
                onChange={(option) => setClientId(option?.value || '')}
                placeholder="Search Client..."
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '48px',
                    '@media (min-width: 768px)': {
                      minHeight: '40px',
                    }
                  })
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg">Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-1">
               <Label className="text-xs text-slate-500">Order / Payment</Label>
               <Input value={terms.order_payment} onChange={e => handleTermChange('order_payment', e.target.value)} className="h-12 md:h-10 text-sm" />
             </div>
             <div className="space-y-1">
               <Label className="text-xs text-slate-500">Taxes</Label>
               <Input value={terms.taxes} onChange={e => handleTermChange('taxes', e.target.value)} className="h-12 md:h-10 text-sm" />
             </div>
             <div className="space-y-1">
               <Label className="text-xs text-slate-500">Payment for Supply</Label>
               <Input value={terms.payment_for_supply} onChange={e => handleTermChange('payment_for_supply', e.target.value)} className="h-12 md:h-10 text-sm" />
             </div>
             <div className="space-y-1">
               <Label className="text-xs text-slate-500">Delivery</Label>
               <Input value={terms.delivery} onChange={e => handleTermChange('delivery', e.target.value)} className="h-12 md:h-10 text-sm" />
             </div>
             <div className="space-y-1">
               <Label className="text-xs text-slate-500">Warranty</Label>
               <Input value={terms.warranty} onChange={e => handleTermChange('warranty', e.target.value)} className="h-12 md:h-10 text-sm" />
             </div>
             <div className="space-y-1">
               <Label className="text-xs text-slate-500">Validity</Label>
               <Input value={terms.validity} onChange={e => handleTermChange('validity', e.target.value)} className="h-12 md:h-10 text-sm" />
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Item Details</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8">
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="w-full min-w-max">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[25%]">Inventory Item</TableHead>
                  <TableHead className="w-[18%]">Description</TableHead>
                  <TableHead className="w-[10%]">Qty</TableHead>
                  <TableHead className="w-[12%] text-right">Rate (₹)</TableHead>
                  <TableHead className="w-[12%] text-right">Item Total</TableHead>
                  <TableHead className="w-[12%] text-center">GST</TableHead>
                  <TableHead className="w-[11%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="align-middle py-3">
                      <Select
                        options={productOptions}
                        value={productOptions.find(opt => opt.value === item.product_id) || null}
                        onChange={(option) => updateItem(item.id, 'product_id', option?.value || '')}
                        placeholder="Search Product..."
                        className="text-sm"
                      />
                    </TableCell>
                    <TableCell className="align-middle py-3">
                      <Input 
                        placeholder="Optional" 
                        className="h-8 text-xs" 
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="align-middle py-3">
                      <Input 
                        type="number" 
                        min="1" 
                        className="h-8" 
                        value={item.quantity || ''}
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell className="align-middle py-3">
                      <Input 
                        type="number" 
                        min="0" 
                        className="h-8" 
                        value={item.unit_rate || ''}
                        onChange={e => updateItem(item.id, 'unit_rate', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell className="align-middle py-3 text-right font-medium text-slate-700">
                      ₹{item.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="align-middle py-3 text-center">
                      <Select
                        options={gstRates.map(g => ({ value: g.id, label: `${g.gst_percentage}%` }))}
                        value={item.gst_id ? { value: item.gst_id, label: `${gstRates.find(g => g.id === item.gst_id)?.gst_percentage}%` } : null}
                        onChange={(option) => updateItem(item.id, 'gst_id', option?.value || '')}
                        placeholder="GST"
                        className="text-xs"
                      />
                      <div className="text-xs text-slate-500 mt-1">
                        ₹{item.tax.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="align-middle py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => confirmRemoveItem(item.id)} disabled={items.length === 1}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden p-4 space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm bg-white">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-700">Item {index + 1}</span>
                  <Button variant="ghost" size="icon" onClick={() => confirmRemoveItem(item.id)} disabled={items.length === 1} className="text-red-500 hover:bg-red-50 h-10 w-10">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Product</Label>
                    <Select
                      options={productOptions}
                      value={productOptions.find(opt => opt.value === item.product_id) || null}
                      onChange={(option) => updateItem(item.id, 'product_id', option?.value || '')}
                      placeholder="Search Product..."
                      className="text-sm"
                      styles={{ control: (base) => ({ ...base, minHeight: '48px' }) }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Description</Label>
                    <Input 
                      placeholder="Optional description" 
                      className="h-12 text-base" 
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Qty</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        className="h-12 text-base" 
                        value={item.quantity || ''}
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Rate (₹)</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        className="h-12 text-base" 
                        value={item.unit_rate || ''}
                        onChange={e => updateItem(item.id, 'unit_rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">GST</Label>
                      <Select
                        options={gstRates.map(g => ({ value: g.id, label: `${g.gst_percentage}%` }))}
                        value={item.gst_id ? { value: item.gst_id, label: `${gstRates.find(g => g.id === item.gst_id)?.gst_percentage}%` } : null}
                        onChange={(option) => updateItem(item.id, 'gst_id', option?.value || '')}
                        placeholder="GST"
                        className="text-sm"
                        styles={{ control: (base) => ({ ...base, minHeight: '48px' }) }}
                      />
                    </div>
                    <div className="space-y-1 text-right">
                      <Label className="text-xs text-slate-500 block mb-1">Item Total</Label>
                      <span className="font-bold text-lg text-slate-800">₹{item.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-right mt-1">
                    Tax Amount: ₹{item.tax.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full h-12 border-dashed border-2 border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" /> Add Another Item
            </Button>
          </div>
          
          <div className="bg-slate-50 p-4 md:p-6 flex justify-end border-t border-slate-200 rounded-b-xl">
            <div className="w-full md:w-72 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Sub Total:</span>
                <span className="font-medium">₹{totalItemAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Tax:</span>
                <span className="font-medium">₹{totalTaxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-lg font-bold text-slate-900">
                <span>Net Amount:</span>
                <span>₹{netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
