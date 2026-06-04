import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { generateQuotationPDF } from "@/lib/generateQuotationPDF"

type QuoteItem = {
  id: string
  description: string
  hsn_sac: string
  qty: number
  uom: string
  rate: number
  discount_percent: number
  tax_desc: string
  tax_percent: number
  value: number
  amount: number
}

export default function CreateQuotation() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  
  // Header details
  const [quoteNo, setQuoteNo] = useState("HNBTQ/2627/155")
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0])
  const [clientName, setClientName] = useState("Maiva Lifesciences Private Limited")
  const [clientCity, setClientCity] = useState("Hosur")
  const [clientState, setClientState] = useState("Tamil Nadu")

  // Items
  const [items, setItems] = useState<QuoteItem[]>([
    { id: "1", description: "Dell Pro Tower", hsn_sac: "84713010", qty: 2, uom: "nos", rate: 97500, discount_percent: 0, tax_desc: "IGST@18%", tax_percent: 18, value: 195000, amount: 230100 },
    { id: "2", description: "WD Blue 1TB", hsn_sac: "84717020", qty: 2, uom: "nos", rate: 16100, discount_percent: 0, tax_desc: "IGST@18%", tax_percent: 18, value: 32200, amount: 37996 },
  ])

  // Footer details
  const [narration, setNarration] = useState("")
  const [terms, setTerms] = useState("")

  useEffect(() => {
    if (isEditing) {
      fetch(`http://localhost:3005/api/quotations/${id}`)
        .then(res => res.json())
        .then(data => {
          setQuoteNo(data.quote_no)
          setQuoteDate(data.quote_date)
          setClientName(data.client_name)
          setClientCity(data.client_city)
          setClientState(data.client_state)
          setNarration(data.narration || "")
          setTerms(data.terms_conditions || "")
          if (data.items) {
            setItems(data.items.map((item: any) => ({
              ...item,
              id: item.id.toString(),
              tax_percent: parseFloat((item.tax_desc || "IGST@18%").match(/\d+/)?.[0] || "18")
            })))
          }
        })
    }
  }, [id, isEditing])

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      description: "", hsn_sac: "", qty: 1, uom: "nos", rate: 0, discount_percent: 0, tax_desc: "IGST@18%", tax_percent: 18, value: 0, amount: 0
    }])
  }

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      
      // Auto calc
      updated.value = updated.qty * updated.rate * (1 - updated.discount_percent / 100)
      updated.tax_percent = parseFloat((updated.tax_desc || "IGST@18%").match(/\d+/)?.[0] || "18")
      updated.amount = updated.value * (1 + updated.tax_percent / 100)
      return updated
    }))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Calculations
  const subTotal = items.reduce((acc, item) => acc + item.value, 0)
  const discount = 0
  const totalTax = items.reduce((acc, item) => acc + (item.amount - item.value), 0)
  
  const grandTotal = subTotal - discount + totalTax
  const roundOff = Math.round(grandTotal) - grandTotal
  const finalTotal = Math.round(grandTotal)

  const handleSave = async () => {
    const payload = {
      quote_no: quoteNo, quote_date: quoteDate, client_name: clientName,
      client_address: "", client_city: clientCity, client_state: clientState,
      sub_total: subTotal, discount, igst: totalTax, cgst: 0, sgst: 0,
      round_off: roundOff, grand_total: finalTotal, narration, terms_conditions: terms,
      items: items.map(i => ({
        description: i.description, hsn_sac: i.hsn_sac, qty: i.qty, uom: i.uom,
        rate: i.rate, discount_percent: i.discount_percent, tax_desc: i.tax_desc,
        value: i.value, amount: i.amount
      }))
    }

    const method = isEditing ? "PUT" : "POST"
    const url = isEditing ? `http://localhost:3005/api/quotations/${id}` : "http://localhost:3005/api/quotations"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        navigate("/quotations")
      }
    } catch (err) { console.error("Save failed", err) }
  }

  const handleDownloadPDF = () => {
    const data = {
      quoteNo, quoteDate, clientName, clientCity, clientState,
      items, subTotal, discount, totalTax, roundOff, finalTotal,
      terms
    }
    generateQuotationPDF(data, 'view')
  }

  return (
    <div className="flex flex-col gap-4 pb-12">
      <div className="bg-gray-100 p-2 text-xs border-b border-gray-300 font-semibold flex gap-4">
        <span><b className="bg-black text-white px-1">s</b> Alt+A: New Account</span>
        <span><b className="bg-black text-white px-1">s</b> Alt+C: New Customer</span>
        <span><b className="bg-black text-white px-1">s</b> Alt+T: New Tax Account</span>
        <span><b className="bg-black text-white px-1">s</b> Alt+I: New Inventory Item</span>
      </div>

      <div className="grid gap-2 text-sm px-4">
        <div className="text-red-700 font-bold italic text-xs mb-2">
          Press ENTER to move forward & SHIFT+ENTER to move back.
        </div>
        
        <div className="grid grid-cols-[140px_300px_1fr] items-center gap-2">
          <Label className="text-right">Estimate No:</Label>
          <Input className="bg-yellow-200 border-gray-400 h-7" value={quoteNo} onChange={e => setQuoteNo(e.target.value)} />
        </div>
        <div className="grid grid-cols-[140px_300px_1fr] items-center gap-2">
          <Label className="text-right">Record Date</Label>
          <Input type="date" className="border-gray-400 h-7" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-[140px_400px_1fr] items-center gap-2">
          <Label className="text-right">Customer/Debtor</Label>
          <div className="flex gap-2 items-center">
             <Input className="border-gray-400 h-7 w-[300px]" value={clientName} onChange={e => setClientName(e.target.value)} />
             <span className="font-semibold">{finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Card className="rounded-none border-gray-400 mx-4">
        <CardContent className="p-0">
          <div className="flex justify-between items-end p-2 bg-gray-50 border-b border-gray-400 text-xs">
            <div className="flex gap-2 items-center">
              <span>F9: Inventory Item:</span>
              <div className="border border-red-300 w-[400px] h-6 bg-white relative">
                 <span className="absolute -top-4 left-0 text-red-700 italic text-[10px]">Press ENTER key to add item.</span>
              </div>
            </div>
            <div className="flex gap-4 text-blue-600 underline">
               <span>Alt+F2: Item History</span>
               <span>View Photo</span>
            </div>
            <div className="flex gap-2 items-center">
              <span>F10: Service</span>
              <div className="border border-gray-300 w-[200px] h-6 bg-white"></div>
            </div>
          </div>
          
          <Table className="text-xs">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="h-8 py-1 border-r border-gray-300 text-black">Item</TableHead>
                <TableHead className="h-8 py-1 border-r border-gray-300 text-black text-right">Qty</TableHead>
                <TableHead className="h-8 py-1 border-r border-gray-300 text-black text-right">Rate</TableHead>
                <TableHead className="h-8 py-1 border-r border-gray-300 text-black text-right">Discount(%)</TableHead>
                <TableHead className="h-8 py-1 border-r border-gray-300 text-black">Tax</TableHead>
                <TableHead className="h-8 py-1 border-r border-gray-300 text-black text-right">Value</TableHead>
                <TableHead className="h-8 py-1 text-black">Description</TableHead>
                <TableHead className="h-8 py-1 w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-b-0 hover:bg-transparent">
                  <TableCell className="py-1 px-2 border-r border-gray-300 bg-blue-600 text-white w-[200px]">
                    <Input className="h-6 bg-transparent border-none text-white p-0 rounded-none shadow-none focus-visible:ring-0" value={item.description.split('\\n')[0]} onChange={e => updateItem(item.id, "description", e.target.value)} />
                  </TableCell>
                  <TableCell className="py-1 px-2 border-r border-gray-300 w-[80px]">
                    <Input type="number" className="h-6 text-right border-none p-0 rounded-none shadow-none focus-visible:ring-0" value={item.qty} onChange={e => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)} />
                  </TableCell>
                  <TableCell className="py-1 px-2 border-r border-gray-300 w-[100px]">
                    <Input type="number" className="h-6 text-right border-none p-0 rounded-none shadow-none focus-visible:ring-0" value={item.rate} onChange={e => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)} />
                  </TableCell>
                  <TableCell className="py-1 px-2 border-r border-gray-300 w-[80px]">
                    <Input type="number" className="h-6 text-right border-none p-0 rounded-none shadow-none focus-visible:ring-0" value={item.discount_percent} onChange={e => updateItem(item.id, "discount_percent", parseFloat(e.target.value) || 0)} />
                  </TableCell>
                  <TableCell className="py-1 px-2 border-r border-gray-300 w-[150px]">
                     <Select value={item.tax_desc} onValueChange={v => updateItem(item.id, "tax_desc", v)}>
                      <SelectTrigger className="h-6 border-none rounded-none shadow-none focus:ring-0 px-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IGST@18%">IGST@18%</SelectItem>
                        <SelectItem value="IGST@12%">IGST@12%</SelectItem>
                        <SelectItem value="IGST@5%">IGST@5%</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-1 px-2 border-r border-gray-300 text-right w-[120px]">
                    {item.value.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                     <Input className="h-6 border-none p-0 rounded-none shadow-none focus-visible:ring-0" value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} />
                  </TableCell>
                  <TableCell className="py-1 px-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-gray-300 text-xs">
             <Button variant="ghost" size="sm" onClick={addItem} className="h-6 text-blue-600">Add Row</Button>
             <span className="text-red-700 italic font-bold">Press DELETE key to remove item row.</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between px-4 mt-8">
        <div className="w-[500px] flex flex-col gap-4">
           <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
             <div className="text-right text-xs">
                Narration<br/>
                <span className="text-[10px] italic text-gray-500">Ctrl+Enter for next line</span>
             </div>
             <textarea className="border border-gray-400 min-h-[80px] p-2 text-xs" value={narration} onChange={e => setNarration(e.target.value)}></textarea>
           </div>
           <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
             <div className="text-right text-xs pt-1">Terms_Conditions</div>
             <textarea className="border border-gray-400 min-h-[80px] p-2 text-xs" value={terms} onChange={e => setTerms(e.target.value)}></textarea>
           </div>
           <Button variant="outline" className="w-24 mt-4" onClick={() => navigate("/quotations")}>Ctrl+Q: Exit</Button>
        </div>

        <div className="w-[300px] flex flex-col gap-2 text-sm">
           <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
             <span className="text-right">Amount</span>
             <Input disabled className="h-7 text-right bg-white rounded-none border-gray-400" value={subTotal.toFixed(2)} />
           </div>
           
           <div className="mt-8"></div>

           <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
             <span className="text-right">Round Off</span>
             <Input disabled className="h-7 text-right bg-white rounded-none border-gray-400" value={roundOff.toFixed(2)} />
           </div>
           <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
             <span className="text-right font-bold">total amount</span>
             <Input disabled className="h-7 text-right bg-gray-200 font-bold rounded-none border-gray-400" value={finalTotal.toFixed(2)} />
           </div>

           <Card className="rounded-none mt-2">
             <CardHeader className="p-2 py-1 bg-gray-100 border-b">
               <CardTitle className="text-xs font-normal">Reference Document</CardTitle>
             </CardHeader>
             <CardContent className="p-2 flex gap-1 justify-between">
                <Button variant="outline" size="sm" className="h-6 text-xs px-2">Browse</Button>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2">View</Button>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2">Delete</Button>
             </CardContent>
           </Card>

           <div className="flex gap-2 justify-end mt-4">
             <Button variant="outline" onClick={handleDownloadPDF}>Alt+F12: Save & View</Button>
             <Button onClick={handleSave}>F12: Save</Button>
           </div>
        </div>
      </div>
    </div>
  )
}
