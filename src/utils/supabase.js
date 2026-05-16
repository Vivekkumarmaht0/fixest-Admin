import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wpwmmlkowxxbwpoeullq.supabase.co';
const supabaseAnonKey = 'sb_publishable_FD4fM6LSN46FvmKeTG-LUQ_vpdupPSz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
