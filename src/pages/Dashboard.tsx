import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Users, Clock, CheckCircle, XCircle } from "lucide-react"
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Quotation, Client } from '../types/database';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Dashboard() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!isSupabaseConfigured) {
        const savedQuotes = localStorage.getItem('demo_quotations');
        if (savedQuotes) {
          setQuotations(JSON.parse(savedQuotes));
        }
        const savedClients = localStorage.getItem('demo_clients');
        if (savedClients) {
          setClientsCount(JSON.parse(savedClients).length);
        }
      } else {
        const [quoteRes, clientRes] = await Promise.all([
          supabase.from('quotations').select('*, client:clients(*)').order('created_at', { ascending: false }),
          supabase.from('clients').select('*', { count: 'exact', head: true })
        ]);
        
        if (quoteRes.data) {
          setQuotations(quoteRes.data);
        }
        if (clientRes.count !== null) {
          setClientsCount(clientRes.count);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const wonQuotes = quotations.filter(q => q.status === 'won');
  const pendingQuotes = quotations.filter(q => q.status === 'pending' || !q.status);
  const lostQuotes = quotations.filter(q => q.status === 'lost');

  const totalRevenue = wonQuotes.reduce((sum, q) => sum + (q.net_amount || 0), 0);
  const pendingRevenue = pendingQuotes.reduce((sum, q) => sum + (q.net_amount || 0), 0);

  const recentQuotations = quotations.slice(0, 5);

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-10 text-slate-500">Loading metrics...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Won Revenue</CardTitle>
                <span className="text-muted-foreground font-bold">₹</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">{wonQuotes.length} approved quotes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Pipeline</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">₹{pendingRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">{pendingQuotes.length} quotes pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Active client base</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quotations.length > 0 ? Math.round((wonQuotes.length / ((wonQuotes.length + lostQuotes.length) || 1)) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Based on closed quotes</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-4">
            <Card className="xl:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="grid gap-2">
                  <CardTitle>Recent Quotations</CardTitle>
                </div>
                <Link to="/quotations" className="text-sm text-blue-600 hover:underline font-medium">
                  View All
                </Link>
              </CardHeader>
              <CardContent>
                {recentQuotations.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">No quotations generated yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b">
                        <tr>
                          <th className="px-4 py-3 font-medium">Quote No.</th>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Client</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentQuotations.map((quote) => (
                          <tr key={quote.id} className="border-b last:border-0 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-blue-600">
                              <Link to={`/quotations/${quote.id}/edit`}>{quote.quote_number}</Link>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {quote.quote_date ? format(new Date(quote.quote_date), 'dd MMM, yyyy') : '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-900 font-medium">
                              {quote.client?.client_name || 'Unknown Client'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                                quote.status === 'won' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                quote.status === 'lost' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {(quote.status || 'pending').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              ₹{quote.net_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
