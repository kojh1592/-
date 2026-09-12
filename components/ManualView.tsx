"use client";
import { useState } from "react";
import { MANUAL_SECTIONS } from "@/lib/data";

export default function ManualView() {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const sections = q
    ? MANUAL_SECTIONS.filter((s: any) => (s.title + s.html).toLowerCase().includes(q))
    : MANUAL_SECTIONS;

  return (
    <div>
      <div className="main-head">
        <div><h2>업무 매뉴얼 (참고자료)</h2><div className="sub">신규자 가이드부터 실무 절차까지 — 읽기 전용 참고 문서</div></div>
      </div>
      <div className="auth-note" style={{ marginBottom: 16 }}>
        ※ 이 매뉴얼은 <b>일반적인 업무 흐름을 정리한 참고용 자료</b>이며, 특정 소방서의 내부 자료가 아닙니다. 소속 서·지역 및 팀 상황에 따라 실제 절차가 다를 수 있으니, 반드시 각자의 팀 상황에 맞게 확인하신 뒤 참고해 주세요.
      </div>
      <div className="manual-search">
        <input type="text" placeholder="매뉴얼 안에서 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="manual-toc">
        {MANUAL_SECTIONS.map((s: any) => (
          <a key={s.id} onClick={() => document.getElementById("manual-" + s.id)?.scrollIntoView({ behavior: "smooth" })}>{s.title}</a>
        ))}
      </div>
      {sections.length === 0 ? (
        <div className="empty">
          <div className="e-title">검색 결과가 없습니다</div>
          <div className="e-sub">다른 검색어로 시도해보세요</div>
        </div>
      ) : (
        sections.map((s: any) => (
          <details className="manual-part" id={"manual-" + s.id} key={s.id} open={!!q}>
            <summary>{s.title}<span className="m-badge">{s.badge}</span></summary>
            <div className="manual-body" dangerouslySetInnerHTML={{ __html: s.html }} />
          </details>
        ))
      )}
    </div>
  );
}
