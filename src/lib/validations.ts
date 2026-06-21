import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Inserisci un email valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
})

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Inserisci almeno 2 caratteri'),
  email: z.string().email('Inserisci un email valida'),
  password: z.string().min(8, 'La password deve essere di almeno 8 caratteri'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
})

export const onboardingStep1Schema = z.object({
  fullName: z.string().min(2, 'Inserisci almeno 2 caratteri'),
  businessName: z.string().optional(),
  vatNumber: z.string().optional(),
  fiscalCode: z.string().optional(),
  address: z.string().optional(),
})

export const onboardingStep2Schema = z.object({
  taxRegime: z.enum(['occasional', 'vat_flat', 'vat_standard'], {
    required_error: 'Seleziona un regime fiscale',
  }),
})

export const onboardingStep3Schema = z.object({
  financialGoal: z.number().min(1, 'Inserisci un importo valido'),
  goalMetric: z.enum(['net_settled', 'gross_total', 'cash_only', 'gross_settled', 'net_pending']),
})

export const onboardingStep4Schema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Inserisci un email valida'),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(8, 'La password deve essere di almeno 8 caratteri'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>
export const backupJobSchema = z.object({
  date: z.string().optional(),
  start_date: z.string().optional(),
  client: z.string().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Titolo richiesto').max(500),
  description: z.string().nullable().optional(),
  payment_method: z.enum(['card', 'cash', 'mixed']).optional().default('card'),
  amount_card: z.number().min(0).max(999999999),
  amount_cash: z.number().min(0).max(999999999),
  net_amount: z.number().min(0).max(999999999).optional().default(0),
  include_cash_in_invoice: z.boolean().optional().default(false),
  total: z.number().optional(),
  status: z.enum(['active', 'completed_pending', 'completed_settled']).optional().default('active'),
  pending_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
}).strict()

export const backupFileSchema = z.array(backupJobSchema).min(1, 'Il file di backup non contiene lavori').max(10000, 'Troppi lavori nel backup')

export type BackupJobData = z.infer<typeof backupJobSchema>
export type OnboardingStep1Data = z.infer<typeof onboardingStep1Schema>
export type OnboardingStep2Data = z.infer<typeof onboardingStep2Schema>
export type OnboardingStep3Data = z.infer<typeof onboardingStep3Schema>
export type OnboardingStep4Data = z.infer<typeof onboardingStep4Schema>
