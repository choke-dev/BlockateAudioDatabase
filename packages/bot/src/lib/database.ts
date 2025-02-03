import { createClient } from '@supabase/supabase-js'

if (!process.env.DATABASE_URL || !process.env.DATABASE_KEY) {
    throw new Error('DATABASE_URL or DATABASE_KEY is not set')
}

export const supabase = createClient(process.env.DATABASE_URL, process.env.DATABASE_KEY)