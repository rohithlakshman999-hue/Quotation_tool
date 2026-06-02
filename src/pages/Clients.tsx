import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"

type Client = {
  id: number
  name: string
  city: string
  state: string
  gstin: string
  address?: string
  pincode?: string
  email?: string
  phone?: string
}

const defaultForm: Partial<Client> = { name: "", city: "", state: "", gstin: "", address: "", pincode: "", email: "", phone: "" }

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Client>>(defaultForm)

  const fetchClients = () => {
    fetch("http://localhost:3000/api/clients")
      .then(res => res.json())
      .then(data => setClients(data))
  }

  useEffect(() => { fetchClients() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? "PUT" : "POST"
    const url = editingId ? `http://localhost:3000/api/clients/${editingId}` : "http://localhost:3000/api/clients"
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
    setOpen(false)
    setEditingId(null)
    setFormData(defaultForm)
    fetchClients()
  }

  const handleEdit = (client: Client) => {
    setEditingId(client.id)
    setFormData(client)
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    if(confirm("Are you sure you want to delete this client?")) {
      await fetch(`http://localhost:3000/api/clients/${id}`, { method: "DELETE" })
      fetchClients()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clients Master</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Client Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>City</Label>
                  <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>State</Label>
                  <Input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>GSTIN</Label>
                <Input value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} />
              </div>
              <Button type="submit" className="mt-4">Save Client</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.city}</TableCell>
                  <TableCell>{client.state}</TableCell>
                  <TableCell>{client.gstin}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
