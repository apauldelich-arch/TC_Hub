import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vptypvwntjeoqapxdbvi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdHlwdndudGplb3FhcHhkYnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MDc3ODYsImV4cCI6MjA5MTI4Mzc4Nn0.hB6lVy1WwrnZeKO3MgmbMSeDpZv0M2a756EC2GikGAc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
