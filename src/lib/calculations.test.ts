import { describe, it, expect } from 'vitest'
import { normalizeIrpefRate, grossToNet, computeJobNetAmount } from './tax'
import { calculateMetrics } from './calculations'
import type { Job } from '../types/database'

describe('normalizeIrpefRate', () => {
  it('converts percentage to decimal', () => {
    expect(normalizeIrpefRate(30)).toBe(0.3)
    expect(normalizeIrpefRate(0.3)).toBe(0.3)
    expect(normalizeIrpefRate(null)).toBe(0.3)
  })
})

describe('grossToNet vat_standard', () => {
  it('applies normalized IRPEF', () => {
    const net = grossToNet(1000, 'vat_standard', 30)
    expect(net).toBeGreaterThan(400)
    expect(net).toBeLessThan(600)
  })
})

describe('computeJobNetAmount mixed', () => {
  it('excludes cash from tax when not in invoice', () => {
    const net = computeJobNetAmount(1000, 500, 'mixed', false, 'occasional')
    expect(net).toBeGreaterThan(500)
  })
})

describe('calculateMetrics balance', () => {
  it('uses net_settled minus expenses', () => {
    const jobs: Job[] = [{
      id: '1', user_id: 'u', client_id: null, title: 't', description: null,
      status: 'completed_settled', payment_method: 'card',
      amount_card: 1000, amount_cash: 0, net_amount: 700,
      include_cash_in_invoice: false, start_date: '2026-01-01',
      pending_date: null, end_date: '2026-01-15', attachment_urls: [], currency: 'EUR', created_at: '', updated_at: '',
    }]
    const m = calculateMetrics(jobs, 100, 'occasional')
    expect(m.balance).toBe(600)
    expect(m.net_settled).toBe(700)
  })
})
