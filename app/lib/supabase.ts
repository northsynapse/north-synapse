
/* =========================================================
   NORTH SYNAPSE
   Supabase 客户端配置
   中文注释：负责连接数据库与认证服务
   ========================================================= */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 从环境变量读取 Supabase 配置。
// 这些值需要在本地 .env.local 或 Vercel Environment Variables 中设置。
// 不要把数据库密码或 service_role key 放在前端代码里。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// 检查是否已填写必要的配置
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

// 只有在配置完整时才创建客户端，避免环境变量尚未设置时直接报错。
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
