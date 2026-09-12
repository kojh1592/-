"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/data";
import type { Profile, Post } from "@/lib/types";
import AuthGate from "@/components/AuthGate";
import AdminPanel from "@/components/AdminPanel";
import CategoryView from "@/components/CategoryView";
import ManualView from "@/components/ManualView";

export default function HomePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "manual" | string>("home");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data as Profile | null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) loadProfile(sess.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session && profile !== undefined) setLoading(false);
  }, [session, profile]);

  async function signOut() {
    await supabase.auth.signOut();
    setActiveTab("home");
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--ink-soft)" }}>불러오는 중...</div>;
  }

  if (!session) return <AuthGate />;

  if (!profile) {
    return (
      <div className="modal-overlay" style={{ zIndex: 200 }}>
        <div className="modal"><h3>계정 정보를 불러오는 중...</h3><p>잠시 후 새로고침 해주세요.</p></div>
      </div>
    );
  }

  if (profile.status === "pending") {
    const smsText = `[화재조사관 정보공유 플랫폼] 계정 승인 요청드립니다.\n이메일: ${profile.email}\n이름: ${profile.name}\n소속: ${profile.station}`;
    return (
      <div className="modal-overlay" style={{ zIndex: 200 }}>
        <div className="modal">
          <h3>관리자 승인 대기 중</h3>
          <p>{profile.email} 계정은 아직 승인되지 않았어요. 관리자 승인 후 이용할 수 있습니다.</p>
          <div className="auth-note">
            <b>010-5384-1592</b> (관리자: 송파소방서 소방위 고준혁)<br />
            위 전화번호로 아래 내용을 복사해서 문자 보내주세요!
          </div>
          <div className="mono" style={{ whiteSpace: "pre-wrap", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 6, padding: 10, fontSize: 11.5, marginBottom: 10 }}>
            {smsText}
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => navigator.clipboard.writeText(smsText)}>📋 내용 복사하기</button>
            <button className="btn btn-ghost" onClick={signOut}>로그아웃</button>
          </div>
        </div>
      </div>
    );
  }
  if (profile.status === "rejected") {
    return (
      <div className="modal-overlay" style={{ zIndex: 200 }}>
        <div className="modal">
          <h3>가입이 승인되지 않았습니다</h3>
          <p>관리자에게 문의해주세요.</p>
          <div className="modal-actions"><button className="btn btn-ghost" onClick={signOut}>로그아웃</button></div>
        </div>
      </div>
    );
  }

  const activeCat = CATEGORIES.find((c: any) => c.id === activeTab);

  return (
    <>
      <header className="top">
        <div className="top-row">
          <div className="title-block">
            <h1>서울소방 화재조사관 정보공유 플랫폼</h1>
            <p>재현실험 아카이브 활성화 및 화재조사관 역량 강화</p>
            <div className="badge-row">
              <div className="badge badge-shared"><span className="dot"></span>SHARED · 팀 전체 공유</div>
              {profile.is_admin && (
                <button className="badge badge-lock" onClick={() => setShowAdmin(true)}>👥 계정 승인</button>
              )}
            </div>
          </div>
          <div className="top-actions">
            <div className="search-wrap">
              <input placeholder="기록·작성자 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <span className="badge badge-lock" style={{ cursor: "default" }}>🧑 {profile.station} {profile.name}</span>
            <button className="badge badge-lock" onClick={signOut}>로그아웃</button>
          </div>
        </div>
      </header>

      <div className="layout">
        <nav className="tabs">
          <div className="tabs-label">개요</div>
          <TabBtn id="home" title="홈" desc="최근 업데이트 · 공지" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
          <div className="tabs-label">참고자료</div>
          <TabBtn id="manual" title="업무 매뉴얼" desc="신규자 가이드, 화재조사 업무 정리" active={activeTab === "manual"} onClick={() => setActiveTab("manual")} />
          <div className="tabs-label">정보 공유</div>
          {CATEGORIES.map((c: any) => (
            <TabBtn key={c.id} id={c.id} title={c.title} desc={c.desc} active={activeTab === c.id} onClick={() => setActiveTab(c.id)} />
          ))}
        </nav>
        <main>
          {activeTab === "home" && <HomeFeed onOpen={(cat) => setActiveTab(cat)} />}
          {activeTab === "manual" && <ManualView />}
          {activeCat && <CategoryView cat={activeCat} profile={profile} isAdmin={profile.is_admin} searchTerm={searchTerm} />}
        </main>
      </div>

      <footer style={{ textAlign: "center", padding: 20, fontSize: 10.5, color: "var(--ink-soft)" }}>
        서울소방 화재조사관 정보공유 플랫폼 · 이 화면의 모든 글은 팀원 전체에게 공유됩니다
      </footer>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}

function TabBtn({ id, title, desc, active, onClick }: { id: string; title: string; desc?: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`tab ${active ? "active" : ""}`} onClick={onClick}>
      <span className="t-title">{title}</span>
      {desc && <span className="t-desc">{desc}</span>}
    </button>
  );
}

function HomeFeed({ onOpen }: { onOpen: (cat: string) => void }) {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => {
      setPosts((data as Post[]) || []);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const catTitle = (id: string) => CATEGORIES.find((c: any) => c.id === id)?.title || id;

  return (
    <div>
      <div className="main-head"><div><h2>홈</h2><div className="sub">최근 올라온 글을 한눈에 확인하세요</div></div></div>
      <div className="dash-section">
        <h4>최근 공유</h4>
        {loading ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>불러오는 중...</p>
        ) : posts.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>아직 공유된 글이 없습니다</p>
        ) : (
          posts.map((p) => (
            <div className="feed-item" key={p.id} style={{ cursor: "pointer" }} onClick={() => onOpen(p.category)}>
              <div>
                <span className="fi-cat">{catTitle(p.category)}</span>
                <span className="fi-title">{p.title}</span>
              </div>
              <span className="fi-meta">{new Date(p.created_at).toLocaleDateString("ko-KR")}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
