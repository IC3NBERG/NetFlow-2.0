import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useFiscalYearStore } from '../stores/fiscalYear'
import { getYearRange } from '../fiscalYear'
import { grossToNet } from '../tax'
import type { Job, Client, FiscalSetup } from '../../types/database'
import type { PaymentMethod, JobStatus } from '../../types/database'

export interface LedgerFilters {
  search: string
  dateFrom: string
  dateTo: string
  method: PaymentMethod | 'all'
  status: JobStatus | 'all'
}

export interface LedgerMetrics {
  totalJobs: number
  grossTotal: number
  netTotal: number
  taxTotal: number
  cardTotal: number
  cashTotal: number
  avgPerJob: number
}

export interface LedgerEntry extends Job {
  client_name: string | null
}

export function useLedgerData() {
  const year = useFiscalYearStore((s) => s.year)
  const range = getYearRange(year)
  const [filters, setFilters] = useState<LedgerFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    method: 'all',
    status: 'completed_settled',
  })

  const jobsQuery = useQuery({
    queryKey: ['ledger', 'jobs', year],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.user.id)
        .in('status', ['completed_settled', 'completed_pending'])
        .gte('start_date', range.gte)
        .lte('start_date', range.lte)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Job[]
    },
    staleTime: 1000 * 60 * 2,
  })

  const clientsQuery = useQuery({
    queryKey: ['ledger', 'clients'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.user.id)
      if (error) throw error
      return (data ?? []) as unknown as Client[]
    },
    staleTime: 1000 * 60 * 5,
  })

  const fiscalSetupQuery = useQuery({
    queryKey: ['ledger', 'fiscal_setup', year],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return null
      const { data, error } = await supabase
        .from('fiscal_setups')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('year', year)
        .maybeSingle()
      if (error) throw error
      return (data ?? null) as unknown as FiscalSetup | null
    },
    staleTime: 1000 * 60 * 5,
  })

  const clientMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clientsQuery.data ?? []) {
      map.set(c.id, c.name)
    }
    return map
  }, [clientsQuery.data])

  const entries: LedgerEntry[] = useMemo(() => {
    const jobs = jobsQuery.data ?? []
    return jobs.map((j) => ({
      ...j,
      client_name: j.client_id ? (clientMap.get(j.client_id) ?? null) : null,
    }))
  }, [jobsQuery.data, clientMap])

  const filtered: LedgerEntry[] = useMemo(() => {
    let result = entries

    if (filters.status !== 'all') {
      result = result.filter((j) => j.status === filters.status)
    }

    if (filters.method !== 'all') {
      result = result.filter((j) => j.payment_method === filters.method)
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.client_name?.toLowerCase().includes(q) ?? false),
      )
    }

    if (filters.dateFrom) {
      result = result.filter((j) => j.start_date >= filters.dateFrom)
    }
    if (filters.dateTo) {
      result = result.filter((j) => j.start_date <= filters.dateTo)
    }

    return result
  }, [entries, filters])

  const metrics: LedgerMetrics = useMemo(() => {
    const settled = filtered.filter((j) => j.status === 'completed_settled')
    const count = settled.length
    const regime = fiscalSetupQuery.data?.tax_regime ?? 'occasional'
    const irpef = fiscalSetupQuery.data?.custom_irpef_rate
    let gross = 0
    let net = 0
    let card = 0
    let cash = 0
    for (const j of settled) {
      const g = j.amount_card + j.amount_cash
      gross += g
      card += j.amount_card
      cash += j.amount_cash
      net += j.net_amount > 0 ? j.net_amount : grossToNet(g, regime, irpef)
    }
    return {
      totalJobs: count,
      grossTotal: gross,
      netTotal: Math.round(net * 100) / 100,
      taxTotal: Math.round((gross - net) * 100) / 100,
      cardTotal: card,
      cashTotal: cash,
      avgPerJob: count > 0 ? Math.round(gross / count) : 0,
    }
  }, [filtered, fiscalSetupQuery.data])

  return {
    entries: filtered,
    metrics,
    filters,
    setFilters,
    isLoading: jobsQuery.isLoading || clientsQuery.isLoading || fiscalSetupQuery.isLoading,
    totalCount: entries.length,
  }
}
