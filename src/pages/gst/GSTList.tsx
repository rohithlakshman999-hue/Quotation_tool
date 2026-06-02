import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { GSTRate } from '../../types/database';
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
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

export const GSTList: React.FC = () => {
  const [rates, setRates] = useState<GSTRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<GSTRate | null>(null);
  
  // Form State
  const [percentage, setPercentage] = useState('');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    if (!isSupabaseConfigured) {
      try {
        const saved = localStorage.getItem('demo_gst_rates');
        if (saved) {
          setRates(JSON.parse(saved));
        } else {
          const defaults = [
            { id: '1', user_id: 'demo', gst_percentage: 0 },
            { id: '2', user_id: 'demo', gst_percentage: 3 },
            { id: '3', user_id: 'demo', gst_percentage: 5 },
            { id: '4', user_id: 'demo', gst_percentage: 12 },
            { id: '5', user_id: 'demo', gst_percentage: 18 },
            { id: '6', user_id: 'demo', gst_percentage: 28 },
          ];
          setRates(defaults);
          localStorage.setItem('demo_gst_rates', JSON.stringify(defaults));
        }
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gst_rates')
        .select('*')
        .order('gst_percentage', { ascending: true });
        
      if (error) throw error;
      setRates(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch GST rates', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      const newPercentage = parseFloat(percentage);
      let updated: GSTRate[];
      if (editingRate) {
        updated = rates.map(r =>
          r.id === editingRate.id
            ? { ...r, gst_percentage: newPercentage }
            : r
        );
        toast.success('GST Rate updated successfully');
      } else {
        const newRate: GSTRate = {
          id: crypto.randomUUID(),
          user_id: 'demo',
          gst_percentage: newPercentage,
        };
        updated = [...rates, newRate];
        toast.success('GST Rate added successfully');
      }
      setRates(updated);
      localStorage.setItem('demo_gst_rates', JSON.stringify(updated));
      setIsOpen(false);
      resetForm();
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const payload = {
        gst_percentage: parseFloat(percentage),
        user_id: userData.user?.id
      };

      if (editingRate) {
        const { error } = await supabase
          .from('gst_rates')
          .update(payload)
          .eq('id', editingRate.id);
        if (error) throw error;
        toast.success('GST Rate updated successfully');
      } else {
        const { error } = await supabase.from('gst_rates').insert([payload]);
        if (error) throw error;
        toast.success('GST Rate added successfully');
      }
      
      setIsOpen(false);
      resetForm();
      fetchRates();
    } catch (error: any) {
      toast.error('Error saving GST rate', { description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this GST rate?')) return;

    if (!isSupabaseConfigured) {
      const updated = rates.filter(r => r.id !== id);
      setRates(updated);
      localStorage.setItem('demo_gst_rates', JSON.stringify(updated));
      toast.success('GST Rate deleted successfully');
      return;
    }
    
    try {
      const { error } = await supabase.from('gst_rates').delete().eq('id', id);
      if (error) throw error;
      toast.success('GST Rate deleted successfully');
      fetchRates();
    } catch (error: any) {
      toast.error('Error deleting GST rate', { description: error.message });
    }
  };

  const openEdit = (rate: GSTRate) => {
    setEditingRate(rate);
    setPercentage(rate.gst_percentage.toString());
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingRate(null);
    setPercentage('');
  };

  const filteredRates = rates.filter(r => 
    r.gst_percentage.toString().includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">GST Master</h2>
          <p className="text-slate-500">Manage Tax Configurations and GST Rates.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add GST Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRate ? 'Edit GST Rate' : 'Add New GST Rate'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="percentage">GST Percentage (%)</Label>
                <Input 
                  id="percentage" 
                  type="number"
                  step="0.01"
                  value={percentage} 
                  onChange={e => setPercentage(e.target.value)} 
                  placeholder="e.g. 18"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">{editingRate ? 'Save Changes' : 'Add Rate'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search by percentage..." 
            className="pl-9 bg-white" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm max-w-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GST Percentage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-10 text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : filteredRates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-10 text-slate-500">No GST rates found.</TableCell>
              </TableRow>
            ) : (
              filteredRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium text-lg">
                    {rate.gst_percentage}%
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(rate)}>
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rate.id)}>
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
    </div>
  );
};
