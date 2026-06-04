import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Client } from '../../types/database';
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
import { Plus, Edit2, Trash2, Search, MapPin, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    client_name: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    gstin: '',
    account_manager: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    if (!isSupabaseConfigured) {
      try {
        const saved = localStorage.getItem('demo_clients');
        if (saved) setClients(JSON.parse(saved));
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('client_name', { ascending: true });
        
      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch clients', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      let updated: Client[];
      if (editingClient) {
        updated = clients.map(c =>
          c.id === editingClient.id
            ? { ...c, ...formData }
            : c
        );
        toast.success('Client updated successfully');
      } else {
        const newClient: Client = {
          id: crypto.randomUUID(),
          user_id: 'local',
          ...formData,
          created_at: new Date().toISOString(),
        };
        updated = [...clients, newClient];
        toast.success('Client added successfully');
      }
      setClients(updated);
      localStorage.setItem('demo_clients', JSON.stringify(updated));
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

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', editingClient.id);
        if (error) throw error;
        toast.success('Client updated successfully');
      } else {
        const { error } = await supabase.from('clients').insert([payload]);
        if (error) throw error;
        toast.success('Client added successfully');
      }
      
      setIsOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      toast.error('Error saving client', { description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;

    if (!isSupabaseConfigured) {
      const updated = clients.filter(c => c.id !== id);
      setClients(updated);
      localStorage.setItem('demo_clients', JSON.stringify(updated));
      toast.success('Client deleted successfully');
      return;
    }
    
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (error: any) {
      toast.error('Error deleting client', { description: error.message });
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      client_name: client.client_name,
      address: client.address,
      city: client.city,
      state: client.state,
      pin: client.pin,
      gstin: client.gstin,
      account_manager: client.account_manager
    });
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingClient(null);
    setFormData({
      client_name: '', address: '', city: '', state: '', pin: '', gstin: '', account_manager: ''
    });
  };

  const filteredClients = clients.filter(c => 
    c.client_name.toLowerCase().includes(search.toLowerCase()) || 
    c.gstin.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Client Master</h2>
          <p className="text-slate-500">Manage your customers and their billing details.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
              <DialogDescription className="hidden">
                {editingClient ? 'Form to edit an existing client' : 'Form to add a new client'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input id="client_name" name="client_name" value={formData.client_name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">Pincode</Label>
                  <Input id="pin" name="pin" value={formData.pin} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN Number</Label>
                  <Input id="gstin" name="gstin" value={formData.gstin} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="account_manager">Account Manager Name</Label>
                  <Input id="account_manager" name="account_manager" value={formData.account_manager} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">{editingClient ? 'Save Changes' : 'Add Client'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search clients..." 
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
              <TableHead>Client Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Account Manager</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">No clients found.</TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.client_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-slate-500 text-sm">
                      <MapPin className="w-3 h-3 mr-1" />
                      {client.city}, {client.state}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                      {client.gstin}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Briefcase className="w-3 h-3 mr-1 text-slate-400" />
                      {client.account_manager}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
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
