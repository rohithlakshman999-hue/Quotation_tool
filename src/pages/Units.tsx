import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2 } from "lucide-react"

type UoM = {
  id: number
  name: string
  symbol: string
  uqc: string
  is_compound: number
}

const defaultForm: Partial<UoM> = { name: "", symbol: "", uqc: "", is_compound: 0 }

export default function Units() {
  const [units, setUnits] = useState<UoM[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<UoM>>(defaultForm)

  const fetchUnits = () => {
    fetch("http://localhost:3000/api/uom")
      .then(res => res.json())
      .then(data => setUnits(data))
  }

  useEffect(() => { fetchUnits() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? "PUT" : "POST"
    const url = editingId ? `http://localhost:3000/api/uom/${editingId}` : "http://localhost:3000/api/uom"
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
    setOpen(false)
    setEditingId(null)
    setFormData(defaultForm)
    fetchUnits()
  }

  const handleEdit = (uom: UoM) => {
    setEditingId(uom.id)
    setFormData(uom)
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    if(confirm("Are you sure you want to delete this unit?")) {
      await fetch(`http://localhost:3000/api/uom/${id}`, { method: "DELETE" })
      fetchUnits()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Units Of Measure</h1>
        <Button onClick={() => { setEditingId(null); setFormData(defaultForm); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Unit
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Unit Of Measure" : "Create Unit Of Measure"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-[140px_1fr] items-center gap-2 text-red-700 font-bold col-span-2 text-center text-xs mb-2">
              Press ENTER to move forward & SHIFT+ENTER to move back.
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <Label className="text-right">Units Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <Label className="text-right">Symbol</Label>
              <Input className="bg-yellow-200" required value={formData.symbol} onChange={e => setFormData({ ...formData, symbol: e.target.value })} />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <Label className="text-right">UQC</Label>
              <Select value={formData.uqc} onValueChange={v => setFormData({ ...formData, uqc: v })}>
                <SelectTrigger><SelectValue placeholder="Select UQC" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KGS-KILOGRAMS">KGS-KILOGRAMS</SelectItem>
                  <SelectItem value="NOS-NUMBERS">NOS-NUMBERS</SelectItem>
                  <SelectItem value="PCS-PIECES">PCS-PIECES</SelectItem>
                  <SelectItem value="BOX-BOXES">BOX-BOXES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <div></div>
              <div className="flex items-center gap-2">
                <Checkbox checked={!!formData.is_compound} onCheckedChange={(c: any) => setFormData({ ...formData, is_compound: c ? 1 : 0 })} />
                <Label>Is Compound Unit ?</Label>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Ctrl+Q: Exit</Button>
              <Button type="submit">Enter: Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Units</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>UQC</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((uom) => (
                <TableRow key={uom.id}>
                  <TableCell className="font-medium">{uom.name}</TableCell>
                  <TableCell>{uom.symbol}</TableCell>
                  <TableCell>{uom.uqc}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(uom)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(uom.id)}>
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
