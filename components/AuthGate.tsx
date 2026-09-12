"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STATIONS, ROLES, RANKS } from "@/lib/data";

function opts(arr: string[]) {
  return arr.map((v) => (
    <option key={v} value={v}>
      {v}
    </option>
  ));
}

export default function AuthGate() {
  const supabase = createClient();
  const [view, setView] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // 로그인 폼
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 회원가입 폼
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [regName, setRegName] = useState("");
  const [regStation, setRegStation] = useState("");
  const [regRole, setRegRole] = useState(ROLES[0]);
  const [regRank, setRegRank] = useState(RANKS[0]);

  function switchView(v: "login" | "register") {
    setView(v);
    setError("");
  }

  async function submitLogin() {
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요."); return; }
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError("이메일 또는 비밀번호가 일치하지 않습니다.");
    // 성공 시 상위 컴포넌트의 onAuthStateChange가 세션을 감지해서 자동으로 화면이 바뀝니다.
  }

  async function submitRegister() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) { setError("올바른 이메일 주소를 입력해주세요."); return; }
    if (regPassword.length < 6) { setError("비밀번호는 6자 이상으로 설정해주세요."); return; }
    if (regPassword !== regPassword2) { setError("비밀번호가 서로 일치하지 않습니다."); return; }
    if (!regName.trim()) { setError("이름을 입력해주세요."); return; }
    if (!regStation) { setError("소속을 선택해주세요."); return; }
    setBusy(true); setError("");
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { name: regName.trim(), station: regStation, role: regRole, rank: regRank },
      },
    });
    setBusy(false);
    if (error) { setError(error.message.includes("already") ? "이미 가입된 이메일입니다." : "가입 중 오류가 발생했습니다: " + error.message); return; }
    setSuccessMsg(`"${regEmail}" 가입 신청이 접수됐어요. 관리자 승인 후 로그인할 수 있습니다. (Supabase 설정에 따라 이메일 인증 확인이 먼저 필요할 수 있어요)`);
    setView("login");
  }

  const selStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--line)", borderRadius: 6, padding: 8, fontSize: 12.5 };

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }}>
      <div className="modal" style={{ maxWidth: view === "register" ? 420 : 400 }}>
        <h3>서울소방 화재조사관 정보공유 플랫폼</h3>
        <div className="auth-tabs">
          <button className={`auth-tab ${view === "login" ? "active" : ""}`} onClick={() => switchView("login")}>로그인</button>
          <button className={`auth-tab ${view === "register" ? "active" : ""}`} onClick={() => switchView("register")}>회원가입</button>
        </div>

        {view === "register" ? (
          <>
            <div className="auth-note">가입 신청 후 <b>관리자 승인</b>이 있어야 로그인할 수 있어요. 승인 전까지는 접속이 제한됩니다.</div>
            {error && <div className="modal-err">{error}</div>}
            <input type="email" placeholder="이메일 (로그인 아이디로 사용)" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} autoComplete="username" />
            <input type="password" placeholder="비밀번호 (6자 이상)" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} autoComplete="new-password" />
            <input type="password" placeholder="비밀번호 확인" value={regPassword2} onChange={(e) => setRegPassword2(e.target.value)} autoComplete="new-password" />
            <input type="text" placeholder="이름" value={regName} onChange={(e) => setRegName(e.target.value)} />
            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div>
                <label className="mono" style={{ fontSize: 10, color: "var(--ink-soft)" }}>소속</label>
                <select style={selStyle} value={regStation} onChange={(e) => setRegStation(e.target.value)}>
                  <option value="">-- 소속을 선택해주세요 --</option>
                  {opts(STATIONS)}
                </select>
              </div>
              <div>
                <label className="mono" style={{ fontSize: 10, color: "var(--ink-soft)" }}>직책</label>
                <select style={selStyle} value={regRole} onChange={(e) => setRegRole(e.target.value)}>{opts(ROLES)}</select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="mono" style={{ fontSize: 10, color: "var(--ink-soft)" }}>계급</label>
              <select style={selStyle} value={regRank} onChange={(e) => setRegRank(e.target.value)}>{opts(RANKS)}</select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy} onClick={submitRegister}>
                {busy ? "처리 중..." : "가입 신청하기"}
              </button>
            </div>
          </>
        ) : (
          <>
            {successMsg && <div className="auth-success">{successMsg}</div>}
            {error && <div className="modal-err">{error}</div>}
            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && submitLogin()}
            />
            <div className="modal-actions">
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={busy} onClick={submitLogin}>
                {busy ? "확인 중..." : "로그인"}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--ink-soft)", margin: "12px 0 0", textAlign: "center" }}>
              계정이 없으신가요? 위 "회원가입" 탭에서 신청해주세요.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
