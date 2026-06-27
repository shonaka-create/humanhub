import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CheckResult = {
  label: string;
  ok: boolean;
  detail: string;
};

async function runChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const placeholder = (v?: string) =>
    !v || v.startsWith("ここに");

  results.push({
    label: "NEXT_PUBLIC_SUPABASE_URL",
    ok: !!url && url.includes("supabase.co"),
    detail: url ?? "(未設定)",
  });
  results.push({
    label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ok: !placeholder(anon),
    detail: placeholder(anon) ? "(未設定 / プレースホルダのまま)" : "設定済み",
  });
  results.push({
    label: "SUPABASE_SERVICE_ROLE_KEY",
    ok: !placeholder(service),
    detail: placeholder(service) ? "(未設定 / プレースホルダのまま)" : "設定済み",
  });

  // 実際に Supabase Auth へ接続できるか確認する。
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getUser();
    // 未ログイン時は "Auth session missing" エラーになるが、これは接続成功を意味する。
    const reachable = !error || /session|missing|jwt/i.test(error.message);
    results.push({
      label: "Supabase への接続",
      ok: reachable,
      detail: reachable ? "接続成功 ✅" : `接続エラー: ${error?.message}`,
    });
  } catch (e) {
    results.push({
      label: "Supabase への接続",
      ok: false,
      detail: `例外: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  return results;
}

export default async function SupabaseCheckPage() {
  const results = await runChecks();
  const allOk = results.every((r) => r.ok);

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 720 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Supabase 接続チェック
      </h1>
      <p style={{ color: "#666", marginTop: 4 }}>
        project: aecbmitnahkcupajkntz
      </p>

      <ul style={{ marginTop: 24, listStyle: "none", padding: 0 }}>
        {results.map((r) => (
          <li
            key={r.label}
            style={{
              display: "flex",
              gap: 12,
              padding: "10px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>{r.ok ? "✅" : "❌"}</span>
            <span style={{ minWidth: 280, fontWeight: 600 }}>{r.label}</span>
            <span style={{ color: "#666" }}>{r.detail}</span>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 24, fontWeight: 700 }}>
        {allOk
          ? "🎉 すべて OK。Supabase に接続できています。"
          : "⚠️ 未完了の項目があります。.env.local を確認してください。"}
      </p>
    </main>
  );
}
