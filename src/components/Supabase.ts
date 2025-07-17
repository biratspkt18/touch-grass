// supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ugljlhyggvclslvioeii.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbGpsaHlnZ3ZjbHNsdmlvZWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTkwNTYsImV4cCI6MjA2ODEzNTA1Nn0.NMhOKDTLSYlWWukSfvJ3HviBQSDQNiu7XlpNYe_5KqA"
const supabase = createClient(supabaseUrl, supabaseKey)
export default supabase;
