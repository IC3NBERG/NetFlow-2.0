-- Seed data for FinTrack local development

-- Insert demo clients
INSERT INTO public.clients (user_id, name, email, phone, vat_number, fiscal_code, address)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'Mario Rossi', 'mario@example.com', '+39 333 1234567', '01234567890', 'RSSMRA80A01H501U', 'Via Roma 1, Milano'),
  ('00000000-0000-0000-0000-000000000000', 'Azienda Beta SRL', 'info@aziendabeta.it', '+39 02 9876543', '09876543210', NULL, 'Corso Italia 25, Roma'),
  ('00000000-0000-0000-0000-000000000000', 'Luigi Verdi', 'luigi@verdi.com', '+39 345 9876543', '04567890123', 'VRDLGU85B20F205V', 'Via Garibaldi 10, Torino');
