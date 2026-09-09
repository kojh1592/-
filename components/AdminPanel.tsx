"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProfileStatus } from "@/lib/types";

function fmtDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<ProfileStatus>("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as Profile[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: ProfileStatus) {
    await supabase.from("profiles").update({ status }).eq("id", id);
    load();
  }

  const counts = {
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    rejected: users.filter((u) => u.status === "rejected").length,
  };
  const list = users.filter((u) => u.status === filter);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480, maxHeight: "82vh", overflow: "auto" }}>
        <h3>계정 승인 관리</h3>
        <p>새로 가입 신청한 계정을 승인/거절하거나, 기존 계정 접근을 회수할 수 있어요.</p>
        <div className="acct-tabs">
          <button className={`chip-btn ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>대기중 ({counts.pending})</button>
          <button className={`chip-btn ${filter === "approved" ? "active" : ""}`} onClick={() => setFilter("approved")}>승인됨 ({counts.approved})</button>
          <button className={`chip-btn ${filter === "rejected" ? "active" : ""}`} onClick={() => setFilter("rejected")}>거절됨 ({counts.rejected})</button>
        </div>
        {loading ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 12.5, textAlign: "center", padding: "20px 0" }}>불러오는 중...</p>
        ) : list.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 12.5, textAlign: "center", padding: "20px 0" }}>해당하는 계정이 없습니다</p>
        ) : (
          list.map((u) => (
            <div className="acct-row" key={u.id}>
              <div className="a-info">
                <b>{u.email}</b> · {u.name} · {u.station} {u.role} {u.rank}
                {u.is_admin && <span className="acct-status approved" style={{ marginLeft: 6 }}>관리자</span>}
                <div className="a-meta">가입신청 {fmtDate(u.created_at)}</div>
              </div>
              <div className="acct-actions">
                {u.status !== "approved" && (
                  <button className="btn btn-primary btn-small" onClick={() => setStatus(u.id, "approved")}>승인</button>
                )}
                {u.status !== "rejected" && (
                  <button className="btn btn-ghost btn-small" onClick={() => setStatus(u.id, "rejected")}>
                    {u.status === "approved" ? "접근 회수" : "거절"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div className="modal-actions" style={{ marginTop: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
