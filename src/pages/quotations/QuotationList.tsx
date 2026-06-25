import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Quotation } from '../../types/database';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Plus, Edit2, Trash2, Search, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { generateQuotationPDF } from '../../lib/pdfGenerator';
import type { Product, GSTRate } from '../../types/database';

export const QuotationList: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    if (!isSupabaseConfigured) {
      // Load from localStorage in demo mode
      try {
        const saved = localStorage.getItem('demo_quotations');
        if (saved) setQuotations(JSON.parse(saved));
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setQuotations(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch quotations', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;

    if (!isSupabaseConfigured) {
      const updated = quotations.filter(q => q.id !== id);
      setQuotations(updated);
      localStorage.setItem('demo_quotations', JSON.stringify(updated));
      toast.success('Quotation deleted successfully');
      return;
    }
    
    try {
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Quotation deleted successfully');
      fetchQuotations();
    } catch (error: any) {
      toast.error('Error deleting quotation', { description: error.message });
    }
  };

  const handleDownload = async (quote: any, action: 'save' | 'preview' = 'save') => {
    let pdfWindow: Window | null = null;
    if (action === 'preview') {
      pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write('<html><body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8fafc;"><h2>Generating your PDF...</h2></body></html>');
      } else {
        toast.warning('Please allow popups for this site to view the PDF');
      }
    }

    try {
      let items = [];
      let products: Product[] = [];
      let gstData: GSTRate[] = [];

      if (!isSupabaseConfigured) {
        const savedItems = localStorage.getItem(`demo_items_${quote.id}`);
        if (savedItems) items = JSON.parse(savedItems);

        const savedProducts = localStorage.getItem('demo_products');
        if (savedProducts) products = JSON.parse(savedProducts);

        const savedGst = localStorage.getItem('demo_gst_rates');
        if (savedGst) gstData = JSON.parse(savedGst);
      } else {
        const [itemsRes, productsRes, gstRes] = await Promise.all([
          supabase.from('quotation_items').select('*').eq('quotation_id', quote.id),
          supabase.from('products').select('*, unit:units(*), gst_rate:gst_rates(*)'),
          supabase.from('gst_rates').select('*')
        ]);
        items = itemsRes.data || [];
        products = productsRes.data || [];
        gstData = gstRes.data || [];
      }

      if (items.length === 0) {
        toast.error('This quotation has no items to generate a PDF.');
        return;
      }

      const pdfItems = items.map((item: any) => {
        const p = products.find((prod: Product) => prod.id === item.product_id);
        const productGst = p?.gst_rate?.gst_percentage ?? gstData.find(g => g.id === p?.gst_id)?.gst_percentage ?? 0;
        const taxPercent = item.tax_percent !== undefined ? item.tax_percent : productGst;
        return {
          productName: p?.product_name || item.description || 'Item',
          description: item.description,
          hsn: p?.hsn || '',
          quantity: item.quantity,
          uom: p?.unit?.symbol || '',
          rate: item.unit_rate,
          taxPercent: taxPercent,
          taxAmount: item.tax,
          total: item.total_amount
        };
      });

      const pdfData = {
        quoteNumber: quote.quote_number,
        quoteDate: quote.quote_date,
        client: quote.client,
        items: pdfItems,
        netAmount: quote.net_amount,
        terms: quote.terms_conditions
      };

      if (action === 'preview') {
        const url = await generateQuotationPDF(pdfData, 'preview');
        if (url && pdfWindow) {
          pdfWindow.location.href = url.toString();
        } else if (pdfWindow) {
          pdfWindow.close();
        }
      } else {
        await generateQuotationPDF(pdfData, 'save');
        toast.success('PDF generated successfully');
      }
    } catch (error: any) {
      if (pdfWindow) pdfWindow.close();
      toast.error('Failed to generate PDF', { description: error.message });
    }
  };

  const filteredQuotations = quotations.filter(q => 
    q.quote_number.toLowerCase().includes(search.toLowerCase()) || 
    (q.client?.client_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Quotations</h2>
          <p className="text-slate-500">Manage and generate professional quotations.</p>
        </div>
        
        <Button className="w-full sm:w-auto h-12 sm:h-10 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/quotations/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Quotation
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 sm:left-2.5 sm:top-2.5 sm:h-4 sm:w-4 text-slate-500" />
          <Input 
            placeholder="Search by quote number or client..." 
            className="pl-10 sm:pl-9 bg-white h-12 sm:h-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-md border border-slate-200 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Net Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-10 w-10 text-slate-300 mb-2" />
                    <p>No quotations found. Create your first quotation!</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium text-blue-600">
                    <Link to={`/quotations/${quote.id}/edit`}>{quote.quote_number}</Link>
                  </TableCell>
                  <TableCell>{format(new Date(quote.quote_date), 'dd MMM, yyyy')}</TableCell>
                  <TableCell>{quote.client?.client_name || 'Unknown Client'}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{quote.net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(quote, 'preview')} title="Preview PDF">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(quote, 'save')} title="Download PDF">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`/quotations/${quote.id}/edit`)}>
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(quote.id)} title="Delete">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading...</div>
        ) : filteredQuotations.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200">
            <div className="flex flex-col items-center justify-center">
              <FileText className="h-10 w-10 text-slate-300 mb-2" />
              <p>No quotations found. Create your first quotation!</p>
            </div>
          </div>
        ) : (
          filteredQuotations.map((quote) => (
            <div key={quote.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <Link to={`/quotations/${quote.id}/edit`} className="font-bold text-blue-600 hover:underline">
                  {quote.quote_number}
                </Link>
                <span className="text-sm text-slate-500">{format(new Date(quote.quote_date), 'dd MMM, yyyy')}</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-500">Client</div>
                <div className="font-medium text-slate-900">{quote.client?.client_name || 'Unknown Client'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-500">Net Amount</div>
                <div className="font-bold text-lg text-slate-800">₹{quote.net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="icon" onClick={() => handleDownload(quote, 'preview')} title="Preview PDF" className="h-10 w-10 bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <Eye className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDownload(quote, 'save')} title="Download PDF" className="h-10 w-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                  <FileText className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`/quotations/${quote.id}/edit`)} className="h-10 w-10 bg-slate-50 text-slate-600 hover:bg-slate-100">
                  <Edit2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(quote.id)} title="Delete" className="h-10 w-10 bg-red-50 text-red-600 hover:bg-red-100">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
