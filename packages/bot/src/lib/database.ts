import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from "@prisma/client";
import { Database } from '../database.types'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error('DATABASE_URL or DATABASE_KEY is not set')
}

export const prisma = new PrismaClient();
export const supabase = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)