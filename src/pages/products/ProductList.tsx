import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Product, Unit, GSTRate } from '../../types/database';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import Select from 'react-select';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [gstRates, setGstRates] = useState<GSTRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    product_name: '',
    hsn: '',
    unit_id: '',
    gst_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!isSupabaseConfigured) {
      try {
        const savedProducts = localStorage.getItem('demo_products');
        if (savedProducts) setProducts(JSON.parse(savedProducts));

        const savedUnits = localStorage.getItem('demo_units');
        if (savedUnits) setUnits(JSON.parse(savedUnits));

        const savedGst = localStorage.getItem('demo_gst_rates');
        if (savedGst) setGstRates(JSON.parse(savedGst));
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select(`
          *,
          unit:units(*),
          gst_rate:gst_rates(*)
        `)
        .order('product_name', { ascending: true });
        
      if (prodErr) throw prodErr;
      setProducts(prodData || []);

      const { data: unitData } = await supabase.from('units').select('*');
      if (unitData) setUnits(unitData);

      const { data: gstData } = await supabase.from('gst_rates').select('*');
      if (gstData) setGstRates(gstData);

    } catch (error: any) {
      toast.error('Failed to fetch products', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      const matchedUnit = units.find(u => u.id === formData.unit_id) || undefined;
      const matchedGst = gstRates.find(g => g.id === formData.gst_id) || undefined;

      let updated: Product[];
      if (editingProduct) {
        updated = products.map(p =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...formData,
                unit: matchedUnit,
                gst_rate: matchedGst,
              }
            : p
        );
        toast.success('Product updated successfully');
      } else {
        const newProduct: Product = {
          id: crypto.randomUUID(),
          user_id: 'demo',
          ...formData,
          unit: matchedUnit,
          gst_rate: matchedGst,
        };
        updated = [...products, newProduct];
        toast.success('Product added successfully');
      }
      setProducts(updated);
      localStorage.setItem('demo_products', JSON.stringify(updated));
      setIsOpen(false);
      resetForm();
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const payload = {
        ...formData,
        user_id: userData.user?.id
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
        toast.success('Product added successfully');
      }
      
      setIsOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error('Error saving product', { description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    if (!isSupabaseConfigured) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      localStorage.setItem('demo_products', JSON.stringify(updated));
      toast.success('Product deleted successfully');
      return;
    }
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Error deleting product', { description: error.message });
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      hsn: product.hsn,
      unit_id: product.unit_id,
      gst_id: product.gst_id
    });
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({ product_name: '', hsn: '', unit_id: '', gst_id: '' });
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(search.toLowerCase()) || 
    p.hsn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Product Master</h2>
          <p className="text-slate-500">Manage your inventory items and services.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto h-12 sm:h-10 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription className="hidden">Product form</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name</Label>
                <Input id="product_name" name="product_name" className="h-12 md:h-10" value={formData.product_name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsn">HSN Code</Label>
                <Input id="hsn" name="hsn" className="h-12 md:h-10" value={formData.hsn} onChange={handleInputChange} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_id">Unit of Measurement</Label>
                  <Select
                    options={units.map(u => ({ value: u.id, label: `${u.unit_name} (${u.symbol})` }))}
                    value={formData.unit_id ? { value: formData.unit_id, label: `${units.find(u => u.id === formData.unit_id)?.unit_name} (${units.find(u => u.id === formData.unit_id)?.symbol})` } : null}
                    onChange={(option) => setFormData({ ...formData, unit_id: option?.value || '' })}
                    placeholder="Search UOM..."
                    className="text-sm"
                    styles={{ control: (base) => ({ ...base, minHeight: '48px', '@media (min-width: 768px)': { minHeight: '40px' } }) }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst_id">GST Rate</Label>
                  <Select
                    options={gstRates.map(g => ({ value: g.id, label: `${g.gst_percentage}%` }))}
                    value={formData.gst_id ? { value: formData.gst_id, label: `${gstRates.find(g => g.id === formData.gst_id)?.gst_percentage}%` } : null}
                    onChange={(option) => setFormData({ ...formData, gst_id: option?.value || '' })}
                    placeholder="Search GST..."
                    className="text-sm"
                    styles={{ control: (base) => ({ ...base, minHeight: '48px', '@media (min-width: 768px)': { minHeight: '40px' } }) }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">{editingProduct ? 'Save Changes' : 'Add Product'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 sm:left-2.5 sm:top-2.5 sm:h-4 sm:w-4 text-slate-500" />
          <Input 
            placeholder="Search products..." 
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
              <TableHead>Product Name</TableHead>
              <TableHead>HSN Code</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>GST</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">No products found.</TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.product_name}</TableCell>
                  <TableCell className="font-mono text-sm">{product.hsn}</TableCell>
                  <TableCell>
                    {product.unit ? (
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                        {product.unit.symbol}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {product.gst_rate ? `${product.gst_rate.gst_percentage}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
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
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200">No products found.</div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <div className="font-bold text-slate-900 text-lg">{product.product_name}</div>
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  HSN: {product.hsn}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="text-slate-500">UOM</div>
                <div className="font-medium">
                  {product.unit ? (
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                      {product.unit.symbol}
                    </span>
                  ) : '-'}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="text-slate-500">GST Rate</div>
                <div className="font-medium">
                  {product.gst_rate ? `${product.gst_rate.gst_percentage}%` : '-'}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="icon" onClick={() => openEdit(product)} className="h-10 w-10 bg-slate-50 text-slate-600 hover:bg-slate-100">
                  <Edit2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-10 w-10 bg-red-50 text-red-600 hover:bg-red-100">
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
