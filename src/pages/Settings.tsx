import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"

export default function Settings() {
  const [settings, setSettings] = useState({
    companyName: "Hertz & Bytes Technologies",
    address: "#68, 1st Floor, Near to S.B.T, Above Karnataka Bank, B.C.R. Complex, Electronic City Post, Bangalore-560100",
    phone: "080-28522300, 28522301",
    email: "sales@hertzbytes.com",
    gstin: "29AADCH1234E1Z5"
  })

  useEffect(() => {
    const saved = localStorage.getItem("company_settings")
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem("company_settings", JSON.stringify(settings))
    alert("Settings saved successfully!")
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Company Details (For PDF Generation)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Company Name</Label>
            <Input value={settings.companyName} onChange={e => setSettings({ ...settings, companyName: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Address</Label>
            <textarea 
              className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              value={settings.address} 
              onChange={e => setSettings({ ...settings, address: e.target.value })} 
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>GSTIN</Label>
            <Input value={settings.gstin} onChange={e => setSettings({ ...settings, gstin: e.target.value })} />
          </div>
          
          <Button className="mt-4" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
