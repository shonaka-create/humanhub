'use client';

import { useState, useTransition } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { inviteMember, removeMember, revokeInvite, updateMemberRole } from '@/lib/memberActions';
import type { MembersBundle, Role } from '@/lib/tenant';

/** ロール表示チップ。 */
function RoleChip({ role, label }: { role: Role; label: string }) {
  const owner = role === 'owner';
  return (
    <span
      style={{
        fontSize: 11,
        padding: '4px 11px',
        borderRadius: 999,
        background: owner ? 'var(--accent)' : 'var(--accent-soft)',
        color: owner ? '#fff' : 'var(--accent)',
      }}
    >
      {label}
    </span>
  );
}

/**
 * アカウント・権限の一覧。
 * - 全メンバーはロール付きで一覧表示。
 * - owner のみ: ロール変更 / 除外 / 招待の作成・取消 が可能。
 */
export function MembersPanel({ bundle, baseUrl }: { bundle: MembersBundle; baseUrl: string }) {
  const { t } = useLang();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const { canManage, members, invites } = bundle;

  function run(action: (fd: FormData) => Promise<void>, fd: FormData) {
    start(async () => {
      await action(fd);
    });
  }

  function copyLink(token: string) {
    const url = `${baseUrl}/login?invite=${token}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const roleLabel = (r: Role) => (r === 'owner' ? t.roleOwner : t.roleStaff);

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 600 }}>{t.membersTitle}</div>
        <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 3 }}>{t.membersDesc}</div>
      </div>

      {/* メンバー一覧 */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '8px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
        {members.map((m, idx) => (
          <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 0', borderBottom: idx === members.length - 1 ? 'none' : '1px solid var(--line)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {m.displayName || m.email}
                {m.isSelf && <span style={{ color: 'var(--ink3)', fontWeight: 400 }}> {t.memberYou}</span>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
            </div>

            {canManage && !m.isSelf ? (
              <>
                <select
                  defaultValue={m.role}
                  disabled={pending}
                  onChange={(e) => {
                    const fd = new FormData();
                    fd.set('user_id', m.userId);
                    fd.set('role', e.target.value);
                    run(updateMemberRole, fd);
                  }}
                  style={selectStyle}
                >
                  <option value="owner">{t.roleOwner}</option>
                  <option value="staff">{t.roleStaff}</option>
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set('user_id', m.userId);
                    run(removeMember, fd);
                  }}
                  style={dangerBtn}
                >
                  {t.memberRemove}
                </button>
              </>
            ) : (
              <RoleChip role={m.role} label={roleLabel(m.role)} />
            )}
          </div>
        ))}
      </div>

      {!canManage && (
        <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 10 }}>{t.memberOwnerOnly}</div>
      )}

      {/* 招待（owner のみ） */}
      {canManage && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{t.memberInvite}</div>
          <form
            action={(fd) => run(inviteMember, fd)}
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}
          >
            <input
              name="email"
              type="email"
              required
              placeholder={t.memberInviteEmail}
              style={{ ...selectStyle, flex: '1 1 220px', minWidth: 180 }}
            />
            <select name="role" defaultValue="staff" style={selectStyle}>
              <option value="staff">{t.roleStaff}</option>
              <option value="owner">{t.roleOwner}</option>
            </select>
            <button type="submit" disabled={pending} style={primaryBtn}>{t.memberInviteSend}</button>
          </form>

          {invites.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 8 }}>{t.memberPendingInvites}</div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: '4px 16px' }}>
                {invites.map((iv, idx) => (
                  <div key={iv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: idx === invites.length - 1 ? 'none' : '1px solid var(--line)', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>{iv.email}</div>
                    </div>
                    <RoleChip role={iv.role} label={roleLabel(iv.role)} />
                    <button type="button" onClick={() => copyLink(iv.token)} style={ghostBtn}>
                      {copied === iv.token ? '✓' : t.memberCopyLink}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set('id', iv.id);
                        run(revokeInvite, fd);
                      }}
                      style={dangerBtn}
                    >
                      {t.memberRevoke}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '8px 10px',
  font: '13px var(--ui)',
  color: 'var(--ink)',
  background: '#fff',
  outline: 'none',
};

const primaryBtn: React.CSSProperties = {
  border: 'none',
  borderRadius: 999,
  padding: '9px 18px',
  background: 'var(--accent)',
  color: '#fff',
  font: '600 12.5px var(--ui)',
  cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 999,
  padding: '6px 12px',
  background: '#fff',
  color: 'var(--ink2)',
  font: '12px var(--ui)',
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 999,
  padding: '6px 12px',
  background: '#fff',
  color: 'var(--rose)',
  font: '12px var(--ui)',
  cursor: 'pointer',
};
