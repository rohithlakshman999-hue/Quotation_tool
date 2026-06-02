import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Unit } from '../../types/database';
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

export const UnitList: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  
  // Form State
  const [unitName, setUnitName] = useState('');
  const [symbol, setSymbol] = useState('');

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    if (!isSupabaseConfigured) {
      try {
        const saved = localStorage.getItem('demo_units');
        if (saved) setUnits(JSON.parse(saved));
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('unit_name', { ascending: true });
        
      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch units', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      let updated: Unit[];
      if (editingUnit) {
        updated = units.map(u =>
          u.id === editingUnit.id
            ? { ...u, unit_name: unitName, symbol: symbol }
            : u
        );
        toast.success('Unit updated successfully');
      } else {
        const newUnit: Unit = {
          id: crypto.randomUUID(),
          user_id: 'local',
          unit_name: unitName,
          symbol: symbol,
        };
        updated = [...units, newUnit];
        toast.success('Unit added successfully');
      }
      setUnits(updated);
      localStorage.setItem('demo_units', JSON.stringify(updated));
      setIsOpen(false);
      resetForm();
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const payload = {
        unit_name: unitName,
        symbol: symbol,
        user_id: userData.user?.id
      };

      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(payload)
          .eq('id', editingUnit.id);
        if (error) throw error;
        toast.success('Unit updated successfully');
      } else {
        const { error } = await supabase.from('units').insert([payload]);
        if (error) throw error;
        toast.success('Unit added successfully');
      }
      
      setIsOpen(false);
      resetForm();
      fetchUnits();
    } catch (error: any) {
      toast.error('Error saving unit', { description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return;

    if (!isSupabaseConfigured) {
      const updated = units.filter(u => u.id !== id);
      setUnits(updated);
      localStorage.setItem('demo_units', JSON.stringify(updated));
      toast.success('Unit deleted successfully');
      return;
    }
    
    try {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (error) throw error;
      toast.success('Unit deleted successfully');
      fetchUnits();
    } catch (error: any) {
      toast.error('Error deleting unit', { description: error.message });
    }
  };

  const openEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitName(unit.unit_name);
    setSymbol(unit.symbol);
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingUnit(null);
    setUnitName('');
    setSymbol('');
  };

  const filteredUnits = units.filter(u => 
    u.unit_name.toLowerCase().includes(search.toLowerCase()) || 
    u.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">UOM Master</h2>
          <p className="text-slate-500">Manage Units of Measurement for your products.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="unitName">Unit Name</Label>
                <Input 
                  id="unitName" 
                  value={unitName} 
                  onChange={e => setUnitName(e.target.value)} 
                  placeholder="e.g. Piece"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input 
                  id="symbol" 
                  value={symbol} 
                  onChange={e => setSymbol(e.target.value)} 
                  placeholder="e.g. PCS"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">{editingUnit ? 'Save Changes' : 'Add Unit'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search units..." 
            className="pl-9 bg-white" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-slate-500">No units found.</TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unit_name}</TableCell>
                  <TableCell>
                    <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded-md font-medium border border-slate-200">
                      {unit.symbol}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(unit)}>
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(unit.id)}>
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
