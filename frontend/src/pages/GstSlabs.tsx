import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"

type GstSlab = {
  id: number
  percentage: number
  description: string
}

const defaultForm: Partial<GstSlab> = { percentage: 0, description: "" }

export default function GstSlabs() {
  const [slabs, setSlabs] = useState<GstSlab[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<GstSlab>>(defaultForm)

  const fetchSlabs = () => {
    fetch("http://localhost:3005/api/gst")
      .then(res => res.json())
      .then(data => setSlabs(data))
  }

  useEffect(() => { fetchSlabs() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? "PUT" : "POST"
    const url = editingId ? `http://localhost:3005/api/gst/${editingId}` : "http://localhost:3005/api/gst"
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
    setOpen(false)
    setEditingId(null)
    setFormData(defaultForm)
    fetchSlabs()
  }

  const handleEdit = (slab: GstSlab) => {
    setEditingId(slab.id)
    setFormData(slab)
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    if(confirm("Are you sure you want to delete this GST slab?")) {
      await fetch(`http://localhost:3005/api/gst/${id}`, { method: "DELETE" })
      fetchSlabs()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">GST Slabs</h1>
        <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add GST Slab
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit GST Slab" : "Add New GST Slab"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Percentage (%)</Label>
              <Input required type="number" placeholder="e.g. 18" value={formData.percentage} onChange={e => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input placeholder="e.g. Standard Rate" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <Button type="submit" className="mt-4">Save Slab</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All GST Slabs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Percentage</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slabs.map((slab) => (
                <TableRow key={slab.id}>
                  <TableCell className="font-medium">{slab.percentage}%</TableCell>
                  <TableCell>{slab.description}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(slab)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(slab.id)}>
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
