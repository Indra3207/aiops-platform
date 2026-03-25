import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://dbxnlaexhztyulkizxsr.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRieG5sYWV4aHp0eXVsa2l6eHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODMyMzksImV4cCI6MjA4ODQ1OTIzOX0.ecCMezgeWnEq3n2YKIstyawZiwuH_PLg1sAMURB6Cz8"

export const supabase = createClient(supabaseUrl, supabaseKey)