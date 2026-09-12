"use client";
import { useState } from "react";
import { REENACT_ARCHIVE, ARCHIVE_FIELDS, classifyField } from "@/lib/data";

export default function ArchiveBrowser() {
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<"all" | "awarded">("all");
  const [field, setField] = useState("");

  const awardedCount = REENACT_ARCHIVE.filter((r: any) => r.a).length;
  let rows = REENACT_ARCHIVE.filter((r: any) => view !== "awarded" || !!r.a);
  if (field) rows = rows.filter((r: any) => classifyField(r.t) === field);
  if (view === "awarded") {
    const order: any = { 최우수: 0, 우수: 1, 장려: 2 };
    rows = rows.slice().sort((a: any, b: any) => (order[a.a] - order[b.a]) || String(a.y).localeCompare(String(b.y)));
  }

  return (
    <details className="manual-part" open={open} style={{ marginBottom: 18 }}>
      <summary onClick={(e) => { e.preventDefault(); setOpen(!open); }}>
        📚 역대 재현실험 논문 아카이브 (2016~2025, 총 {REENACT_ARCHIVE.length}건)
        <span className="m-badge">공문 붙임3 기준 · 제목만 정리, 원문 아님</span>
      </summary>
      <div className="manual-body">
        <p style={{ marginTop: 0 }}>서울소방 재현실험 계획 붙임자료에 실린 역대 연구 제목을 모아뒀어요.</p>
        <div className="auth-note" style={{ marginBottom: 14 }}>
          ※ 이 목록은 <b>역대 재현실험의 제목과 분야 분류만</b> 제공합니다. 실제 실험 방법·결과 등 원문 자료는 여기 포함되어 있지 않으며, 필요하신 경우 본부 담당 부서의 별도 허가를 받아 확인해 주세요. 특정 소방서를 알 수 없도록 소속 정보는 표시하지 않아요.
        </div>
        <div className="chip-row">
          <button className={`chip-btn ${view === "all" ? "active" : ""}`} onClick={() => setView("all")}>전체 기록 ({REENACT_ARCHIVE.length})</button>
          <button className={`chip-btn ${view === "awarded" ? "active" : ""}`} onClick={() => setView("awarded")}>🏆 수상작 모음 ({awardedCount})</button>
        </div>
        <div className="chip-row">
          <button className={`chip-btn ${field === "" ? "active" : ""}`} onClick={() => setField("")}>전체 분야</button>
          {ARCHIVE_FIELDS.map((f: string) => (
            <button key={f} className={`chip-btn ${field === f ? "active" : ""}`} onClick={() => setField(f)}>{f}</button>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 8 }}>{rows.length}건 표시 중</div>
        <div style={{ maxHeight: 440, overflow: "auto", border: "1px solid var(--line)", borderRadius: 6 }}>
          <table style={{ margin: 0 }}>
            <tbody>
              <tr><th style={{ width: 70 }}>연도</th><th>제목</th><th style={{ width: 60 }}>수상</th></tr>
              {rows.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--ink-soft)" }}>해당 조건의 논문이 없습니다</td></tr>
              ) : (
                rows.map((r: any, i: number) => (
                  <tr key={i}><td className="mono">{r.y}</td><td>{r.t}</td><td>{r.a && <b>{r.a}</b>}</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 0 }}>※ 분야 구분은 제목 키워드 기반 자동 분류라 다소 부정확할 수 있어요 — 참고용으로만 봐주세요.</p>
      </div>
    </details>
  );
}
