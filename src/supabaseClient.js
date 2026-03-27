import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxvtywinnrvjdeeyqsdl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dnR5d2lubnJ2amRlZXlxc2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODcxNDMsImV4cCI6MjA5MDE2MzE0M30.N-BRyjT_nrA3Pv6M-Eoh_QDLa7KIrtPcEHMztjghnZw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)