import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * service_role キーを使った管理者クライアント（サーバー専用）。
 * RLS をバイパスするため、絶対にクライアントへ公開しないこと。
 * Storage のバケット管理やバッチ処理など、特権操作にのみ使用する。
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
