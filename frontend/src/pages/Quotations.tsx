import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, FileText, Edit, Trash2 } from "lucide-react"
import { generateQuotationPDF } from "@/lib/generateQuotationPDF"

type Quotation = {
  id: number
  quote_no: string
  quote_date: string
  client_name: string
  grand_total: number
  status: string
}

export default function Quotations() {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQuotes = () => {
    fetch("http://localhost:3005/api/quotations")
      .then(res => res.json())
      .then(data => {
        setQuotations(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch quotes", err)
        setLoading(false)
      })
  }

  useEffect(() => { fetchQuotes() }, [])

  const handleDelete = async (id: number) => {
    if(confirm("Are you sure you want to delete this quotation?")) {
      await fetch(`http://localhost:3005/api/quotations/${id}`, { method: "DELETE" })
      fetchQuotes()
    }
  }

  const handleView = async (quote: Quotation) => {
    try {
      const res = await fetch(`http://localhost:3005/api/quotations/${quote.id}`)
      const fullQuote = await res.json()
      // format data for PDF
      const pdfData = {
        quoteNo: fullQuote.quote_no,
        quoteDate: fullQuote.quote_date,
        clientName: fullQuote.client_name,
        clientCity: fullQuote.client_city,
        clientState: fullQuote.client_state,
        items: fullQuote.items.map((i: any) => ({
          ...i,
          tax_percent: parseFloat((i.tax_desc || "IGST@18%").match(/\d+/)?.[0] || "18")
        })),
        subTotal: fullQuote.sub_total,
        discount: fullQuote.discount,
        totalTax: fullQuote.igst + fullQuote.cgst + fullQuote.sgst,
        roundOff: fullQuote.round_off,
        finalTotal: fullQuote.grand_total,
        terms: fullQuote.terms_conditions || ""
      }
      generateQuotationPDF(pdfData, 'view')
    } catch (err) {
      console.error("Failed to view PDF", err)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
        <Button asChild>
          <Link to="/quotations/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Quotation
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p>No quotations found.</p>
              <p className="text-sm">Create your first quotation to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quote_no}</TableCell>
                    <TableCell>{quote.quote_date}</TableCell>
                    <TableCell>{quote.client_name}</TableCell>
                    <TableCell>₹{quote.grand_total.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                        {quote.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleView(quote)} title="View PDF">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/edit/${quote.id}`)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(quote.id)} title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
