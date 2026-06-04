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

type Product = {
  id: number
  name: string
  hsn_code: string
  barcode: string
  uom: string
  description: string
  initial_qty: number
  as_of_date: string
  initial_cost: number
  min_order_qty: number
  category: string
  subcategory: string
  remarks: string
  tax_account: string
  additional_cess: number
  enable_pricewise_tax: number
  default_purchase_price_excl: number
  default_purchase_price_incl: number
  default_sale_price_excl: number
  default_sale_price_incl: number
  default_discount_percent: number
}

const defaultForm: Partial<Product> = {
  name: "", hsn_code: "", barcode: "", uom: "numbers", description: "",
  initial_qty: 0, as_of_date: new Date().toISOString().split('T')[0], initial_cost: 0, min_order_qty: 0,
  category: "", subcategory: "", remarks: "", tax_account: "GST@18%", additional_cess: 0,
  enable_pricewise_tax: 0, default_purchase_price_excl: 0, default_purchase_price_incl: 0,
  default_sale_price_excl: 0, default_sale_price_incl: 0, default_discount_percent: 0
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Product>>(defaultForm)

  const fetchProducts = () => {
    fetch("http://localhost:3005/api/products")
      .then(res => res.json())
      .then(data => setProducts(data))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? "PUT" : "POST"
    const url = editingId ? `http://localhost:3005/api/products/${editingId}` : "http://localhost:3005/api/products"
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
    setOpen(false)
    setEditingId(null)
    setFormData(defaultForm)
    fetchProducts()
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData(product)
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    if(confirm("Are you sure you want to delete this product?")) {
      await fetch(`http://localhost:3005/api/products/${id}`, { method: "DELETE" })
      fetchProducts()
    }
  }

  const handleAddNew = () => {
    setEditingId(null)
    setFormData(defaultForm)
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Items</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Inventory Item" : "Create Inventory Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 py-4">
            
            {/* Left Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">Item Name</Label>
                <Input className="bg-yellow-100" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">HSN</Label>
                <Input value={formData.hsn_code} onChange={e => setFormData({ ...formData, hsn_code: e.target.value })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">Barcode</Label>
                <Input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">Units Of Measure</Label>
                <Input value={formData.uom} onChange={e => setFormData({ ...formData, uom: e.target.value })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <Label className="text-right pt-2">Item Description</Label>
                <textarea className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-2 mt-6">
                <Label className="text-right">Initial Quantity</Label>
                <Input type="number" value={formData.initial_qty} onChange={e => setFormData({ ...formData, initial_qty: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">As Of Date</Label>
                <Input type="date" value={formData.as_of_date} onChange={e => setFormData({ ...formData, as_of_date: e.target.value })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">Initial Cost/Unit</Label>
                <Input type="number" value={formData.initial_cost} onChange={e => setFormData({ ...formData, initial_cost: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">Value</Label>
                <Input disabled value={((formData.initial_qty || 0) * (formData.initial_cost || 0)).toFixed(2)} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">Min Order Quantity</Label>
                <Input type="number" value={formData.min_order_qty} onChange={e => setFormData({ ...formData, min_order_qty: parseFloat(e.target.value) || 0 })} />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-2 mt-6">
                <Label className="text-right">Item Category</Label>
                <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">Item Subcategory</Label>
                <Input value={formData.subcategory} onChange={e => setFormData({ ...formData, subcategory: e.target.value })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-right">Remarks</Label>
                <Input value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="border border-dashed border-gray-300 w-32 h-32 flex items-center justify-center text-sm text-gray-400 mx-auto bg-gray-50">
                Item Image
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <Label className="text-right">Default Tax Account</Label>
                  <Select value={formData.tax_account} onValueChange={v => setFormData({ ...formData, tax_account: v })}>
                    <SelectTrigger><SelectValue placeholder="Tax" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST@18%">GST@18%</SelectItem>
                      <SelectItem value="GST@12%">GST@12%</SelectItem>
                      <SelectItem value="GST@5%">GST@5%</SelectItem>
                      <SelectItem value="GST@0%">GST@0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <Label className="text-right">Additional Cess</Label>
                  <Input type="number" value={formData.additional_cess} onChange={e => setFormData({ ...formData, additional_cess: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Checkbox checked={!!formData.enable_pricewise_tax} onCheckedChange={(c: any) => setFormData({ ...formData, enable_pricewise_tax: c ? 1 : 0 })} />
                  <Label>Enable Pricewise Tax</Label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm font-semibold mt-8">
                <div></div>
                <div>Exclusive Tax</div>
                <div>Inclusive Tax</div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <Label className="text-right">Default Purchase Price</Label>
                <Input type="number" value={formData.default_purchase_price_excl} onChange={e => setFormData({ ...formData, default_purchase_price_excl: parseFloat(e.target.value) || 0 })} />
                <Input type="number" value={formData.default_purchase_price_incl} onChange={e => setFormData({ ...formData, default_purchase_price_incl: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <Label className="text-right">Default Sale Price</Label>
                <Input type="number" value={formData.default_sale_price_excl} onChange={e => setFormData({ ...formData, default_sale_price_excl: parseFloat(e.target.value) || 0 })} />
                <Input type="number" value={formData.default_sale_price_incl} onChange={e => setFormData({ ...formData, default_sale_price_incl: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <Label className="text-right">Default Discount %</Label>
                <div className="col-span-2">
                  <Input type="number" value={formData.default_discount_percent} onChange={e => setFormData({ ...formData, default_discount_percent: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <Button type="submit">F12: Save</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>HSN Code</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-blue-600">{product.name}</TableCell>
                  <TableCell>{product.hsn_code}</TableCell>
                  <TableCell>{product.uom}</TableCell>
                  <TableCell>₹{(product.default_sale_price_excl || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
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
