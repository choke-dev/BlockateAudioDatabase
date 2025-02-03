import { SUPABASE_SERVICE_KEY } from "$env/static/private";
import { SUPABASE_URL } from "$lib/config/database";
import { PrismaClient } from "@prisma/client";
import { createClient } from '@supabase/supabase-js';

export const prisma = new PrismaClient();
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)