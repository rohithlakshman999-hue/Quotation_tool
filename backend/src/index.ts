import express from 'express'
import cors from 'cors'
import { getDb } from './db'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' })
})

// --- SEED DATA FUNCTION ---
async function seedData() {
  const db = await getDb()
  const clientsCount = await db.get('SELECT COUNT(*) as count FROM clients')
  if (clientsCount.count === 0) {
    await db.run("INSERT INTO clients (name, city, state, gstin, phone) VALUES ('Maiva Lifesciences Private Limited', 'Hosur', 'Tamil Nadu', '29AJGPG7739M1ZJ', '1234567890')")
    await db.run("INSERT INTO uom (name, symbol, uqc, is_compound) VALUES ('Kilogram', 'kg', 'KGS-KILOGRAMS', 0)")
    await db.run("INSERT INTO gst_slabs (percentage, description) VALUES (18, 'IGST@18%')")
    await db.run("INSERT INTO gst_slabs (percentage, description) VALUES (0, 'IGST@0%')")
    await db.run("INSERT INTO products (name, hsn_code, uom, description, initial_qty, category, subcategory, tax_account, default_sale_price_excl) VALUES ('Dell Desktop', '84713010', 'nos', 'Dell Pro Tower', 10, 'Computers', 'Desktops', 'IGST@18%', 97500)")
    await db.run("INSERT INTO products (name, hsn_code, uom, description, initial_qty, category, subcategory, tax_account, default_sale_price_excl) VALUES ('Desktop 1TB SATA HDD', '84717020', 'nos', 'WD Blue 1TB', 20, 'Components', 'Storage', 'IGST@18%', 16100)")
  }
}

// --- CLIENTS ---
app.get('/api/clients', async (req, res) => {
  const db = await getDb()
  const clients = await db.all('SELECT * FROM clients ORDER BY id DESC')
  res.json(clients)
})

app.post('/api/clients', async (req, res) => {
  try {
    const db = await getDb()
    const { name, address, city, state, pincode, gstin, email, phone } = req.body
    const result = await db.run(
      'INSERT INTO clients (name, address, city, state, pincode, gstin, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, address, city, state, pincode, gstin, email, phone]
    )
    res.json({ id: result.lastID })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

app.put('/api/clients/:id', async (req, res) => {
  try {
    const db = await getDb()
    const { name, address, city, state, pincode, gstin, email, phone } = req.body
    await db.run(
      'UPDATE clients SET name=?, address=?, city=?, state=?, pincode=?, gstin=?, email=?, phone=? WHERE id=?',
      [name, address, city, state, pincode, gstin, email, phone, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const db = await getDb()
    await db.run('DELETE FROM clients WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
  const db = await getDb()
  const products = await db.all('SELECT * FROM products ORDER BY id DESC')
  res.json(products)
})

app.post('/api/products', async (req, res) => {
  try {
    const db = await getDb()
    const p = req.body
    const result = await db.run(`
      INSERT INTO products (
        name, hsn_code, barcode, uom, description, initial_qty, as_of_date, initial_cost, min_order_qty,
        category, subcategory, remarks, tax_account, additional_cess, enable_pricewise_tax,
        default_purchase_price_excl, default_purchase_price_incl, default_sale_price_excl, default_sale_price_incl, default_discount_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [p.name, p.hsn_code, p.barcode, p.uom, p.description, p.initial_qty, p.as_of_date, p.initial_cost, p.min_order_qty,
        p.category, p.subcategory, p.remarks, p.tax_account, p.additional_cess, p.enable_pricewise_tax ? 1 : 0,
        p.default_purchase_price_excl, p.default_purchase_price_incl, p.default_sale_price_excl, p.default_sale_price_incl, p.default_discount_percent])
    res.json({ id: result.lastID })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

app.put('/api/products/:id', async (req, res) => {
  try {
    const db = await getDb()
    const p = req.body
    await db.run(`
      UPDATE products SET 
        name=?, hsn_code=?, barcode=?, uom=?, description=?, initial_qty=?, as_of_date=?, initial_cost=?, min_order_qty=?,
        category=?, subcategory=?, remarks=?, tax_account=?, additional_cess=?, enable_pricewise_tax=?,
        default_purchase_price_excl=?, default_purchase_price_incl=?, default_sale_price_excl=?, default_sale_price_incl=?, default_discount_percent=?
      WHERE id=?
    `, [p.name, p.hsn_code, p.barcode, p.uom, p.description, p.initial_qty, p.as_of_date, p.initial_cost, p.min_order_qty,
        p.category, p.subcategory, p.remarks, p.tax_account, p.additional_cess, p.enable_pricewise_tax ? 1 : 0,
        p.default_purchase_price_excl, p.default_purchase_price_incl, p.default_sale_price_excl, p.default_sale_price_incl, p.default_discount_percent, req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    const db = await getDb()
    await db.run('DELETE FROM products WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

// --- UOM ---
app.get('/api/uom', async (req, res) => {
  const db = await getDb()
  const uoms = await db.all('SELECT * FROM uom ORDER BY id DESC')
  res.json(uoms)
})

app.post('/api/uom', async (req, res) => {
  try {
    const db = await getDb()
    const { name, symbol, uqc, is_compound } = req.body
    const result = await db.run('INSERT INTO uom (name, symbol, uqc, is_compound) VALUES (?, ?, ?, ?)', [name, symbol, uqc, is_compound ? 1 : 0])
    res.json({ id: result.lastID })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

app.put('/api/uom/:id', async (req, res) => {
  try {
    const db = await getDb()
    const { name, symbol, uqc, is_compound } = req.body
    await db.run('UPDATE uom SET name=?, symbol=?, uqc=?, is_compound=? WHERE id=?', [name, symbol, uqc, is_compound ? 1 : 0, req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

app.delete('/api/uom/:id', async (req, res) => {
  try {
    const db = await getDb()
    await db.run('DELETE FROM uom WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

// --- GST SLABS ---
app.get('/api/gst', async (req, res) => {
  const db = await getDb()
  const slabs = await db.all('SELECT * FROM gst_slabs ORDER BY percentage ASC')
  res.json(slabs)
})

app.post('/api/gst', async (req, res) => {
  try {
    const db = await getDb()
    const { percentage, description } = req.body
    const result = await db.run('INSERT INTO gst_slabs (percentage, description) VALUES (?, ?)', [percentage, description])
    res.json({ id: result.lastID })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

app.put('/api/gst/:id', async (req, res) => {
  try {
    const db = await getDb()
    const { percentage, description } = req.body
    await db.run('UPDATE gst_slabs SET percentage=?, description=? WHERE id=?', [percentage, description, req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

app.delete('/api/gst/:id', async (req, res) => {
  try {
    const db = await getDb()
    await db.run('DELETE FROM gst_slabs WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

// --- QUOTATIONS ---
app.get('/api/quotations', async (req, res) => {
  try {
    const db = await getDb()
    const quotes = await db.all('SELECT * FROM quotations ORDER BY id DESC')
    res.json(quotes)
  } catch (error) { res.status(500).json({ error: 'Failed' }) }
})

app.get('/api/quotations/:id', async (req, res) => {
  try {
    const db = await getDb()
    const quote = await db.get('SELECT * FROM quotations WHERE id=?', [req.params.id])
    if (!quote) return res.status(404).json({ error: 'Not found' })
    const items = await db.all('SELECT * FROM quotation_items WHERE quotation_id=?', [req.params.id])
    res.json({ ...quote, items })
  } catch (error) { res.status(500).json({ error: 'Failed' }) }
})

app.post('/api/quotations', async (req, res) => {
  try {
    const db = await getDb()
    const q = req.body

    const result = await db.run(`
      INSERT INTO quotations (quote_no, quote_date, client_name, client_address, client_city, client_state, sub_total, discount, igst, cgst, sgst, round_off, grand_total, narration, terms_conditions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [q.quote_no, q.quote_date, q.client_name, q.client_address, q.client_city, q.client_state, q.sub_total, q.discount, q.igst, q.cgst, q.sgst, q.round_off, q.grand_total, q.narration, q.terms_conditions])

    const quotationId = result.lastID

    if (q.items && q.items.length > 0) {
      for (const item of q.items) {
        await db.run(`
          INSERT INTO quotation_items (quotation_id, description, hsn_sac, qty, uom, rate, discount_percent, tax_desc, value, amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [quotationId, item.description, item.hsn_sac, item.qty, item.uom, item.rate, item.discount_percent, item.tax_desc, item.value, item.amount])
      }
    }

    res.json({ success: true, id: quotationId })
  } catch (error) { res.status(500).json({ error: 'Failed' }) }
})

app.put('/api/quotations/:id', async (req, res) => {
  try {
    const db = await getDb()
    const q = req.body
    const quoteId = req.params.id

    await db.run(`
      UPDATE quotations SET quote_no=?, quote_date=?, client_name=?, client_address=?, client_city=?, client_state=?, sub_total=?, discount=?, igst=?, cgst=?, sgst=?, round_off=?, grand_total=?, narration=?, terms_conditions=?
      WHERE id=?
    `, [q.quote_no, q.quote_date, q.client_name, q.client_address, q.client_city, q.client_state, q.sub_total, q.discount, q.igst, q.cgst, q.sgst, q.round_off, q.grand_total, q.narration, q.terms_conditions, quoteId])

    // Delete old items and insert new ones
    await db.run('DELETE FROM quotation_items WHERE quotation_id=?', [quoteId])
    if (q.items && q.items.length > 0) {
      for (const item of q.items) {
        await db.run(`
          INSERT INTO quotation_items (quotation_id, description, hsn_sac, qty, uom, rate, discount_percent, tax_desc, value, amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [quoteId, item.description, item.hsn_sac, item.qty, item.uom, item.rate, item.discount_percent, item.tax_desc, item.value, item.amount])
      }
    }

    res.json({ success: true })
  } catch (error) { res.status(500).json({ error: 'Failed' }) }
})

app.delete('/api/quotations/:id', async (req, res) => {
  try {
    const db = await getDb()
    await db.run('DELETE FROM quotations WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed' }) }
})

const PORT = 3005
app.listen(PORT, async () => {
  await getDb()
  await seedData()
  console.log(`Server running on port ${PORT}`)
})
