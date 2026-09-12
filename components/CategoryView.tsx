"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { STATIONS, ROLES, RANKS, catUi } from "@/lib/data";
import { compressImageFile, MAX_PHOTOS_PER_POST } from "@/lib/imageUtils";
import ArchiveBrowser from "@/components/ArchiveBrowser";
import type { Post, Profile } from "@/lib/types";

function fmtDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function opts(arr: string[]) {
  return arr.map((v) => <option key={v} value={v}>{v}</option>);
}
const uid = () => "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export default function CategoryView({ cat, profile, isAdmin, searchTerm }: { cat: any; profile: Profile; isAdmin: boolean; searchTerm: string }) {
  const supabase = createClient();
  const ui = catUi(cat);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ station: "", role: "", rank: "", extra: "", extra2: "" });
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("posts").select("*").eq("category", cat.id);
    const list = ((data as Post[]) || []).slice().sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    setPosts(list);
    setLoading(false);
  }, [cat.id]);

  useEffect(() => { load(); }, [load]);

  // 비공개 버킷이라 사진은 서명된 URL을 따로 발급받아야 함
  useEffect(() => {
    const allPaths = Array.from(new Set(posts.flatMap((p) => p.photo_paths || [])));
    const missing = allPaths.filter((p) => !photoUrls[p]);
    if (missing.length === 0) return;
    (async () => {
      const entries: [string, string][] = [];
      for (const path of missing) {
        const { data } = await supabase.storage.from("post-photos").createSignedUrl(path, 3600);
        if (data?.signedUrl) entries.push([path, data.signedUrl]);
      }
      if (entries.length) setPhotoUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
  }, [posts]); // eslint-disable-line react-hooks/exhaustive-deps

  let visible = posts.filter((p) => {
    if (filters.station && p.station !== filters.station) return false;
    if (filters.role && p.role !== filters.role) return false;
    if (filters.rank && p.rank !== filters.rank) return false;
    if (filters.extra && p.extra !== filters.extra) return false;
    if (filters.extra2 && p.extra2 !== filters.extra2) return false;
    if (searchTerm) {
      const hay = (p.title + " " + p.content + " " + (p.anonymous ? "" : p.author_name)).toLowerCase();
      if (!hay.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  const hasFilter = filters.station || filters.role || filters.rank || filters.extra || filters.extra2 || searchTerm;

  async function deletePost(post: Post) {
    if (!confirm("이 글을 삭제할까요?")) return;
    if (post.photo_paths?.length) await supabase.storage.from("post-photos").remove(post.photo_paths);
    await supabase.from("posts").delete().eq("id", post.id);
    load();
  }
  async function togglePin(post: Post) {
    await supabase.from("posts").update({ pinned: !post.pinned }).eq("id", post.id);
    load();
  }

  return (
    <div>
      <div className="main-head">
        <div><h2>{cat.title}</h2><div className="sub">{cat.desc}</div></div>
        <button className="btn btn-primary" onClick={() => setEditingId("new")}>{ui.addLabel}</button>
      </div>

      {cat.id === "reenact" && <ArchiveBrowser />}

      <div className="filters">
        <select value={filters.station} onChange={(e) => setFilters({ ...filters, station: e.target.value })}>
          <option value="">전체 소속</option>{opts(STATIONS)}
        </select>
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">전체 직책</option>{opts(ROLES)}
        </select>
        <select value={filters.rank} onChange={(e) => setFilters({ ...filters, rank: e.target.value })}>
          <option value="">전체 계급</option>{opts(RANKS)}
        </select>
        {cat.extra?.type === "select" && (
          <select value={filters.extra} onChange={(e) => setFilters({ ...filters, extra: e.target.value })}>
            <option value="">전체 {cat.extra.label}</option>{opts(cat.extra.options)}
          </select>
        )}
        {cat.extra2?.type === "select" && (
          <select value={filters.extra2} onChange={(e) => setFilters({ ...filters, extra2: e.target.value })}>
            <option value="">전체 {cat.extra2.label}</option>{opts(cat.extra2.options)}
          </select>
        )}
        {hasFilter && (
          <span className="clear-filters" onClick={() => setFilters({ station: "", role: "", rank: "", extra: "", extra2: "" })}>필터 초기화</span>
        )}
      </div>

      {editingId === "new" && (
        <PostForm cat={cat} ui={ui} profile={profile} mode="new" onCancel={() => setEditingId(null)} onSaved={() => { setEditingId(null); load(); }} />
      )}

      {loading ? (
        <p style={{ color: "var(--ink-soft)", fontSize: 13, padding: "20px 0" }}>불러오는 중...</p>
      ) : visible.length === 0 && editingId !== "new" ? (
        <div className="empty">
          <div className="e-title">{hasFilter ? "조건에 맞는 기록이 없습니다" : ui.emptyTitle}</div>
          <div className="e-sub">{hasFilter ? "검색어나 필터를 조정해보세요" : ui.emptySub}</div>
        </div>
      ) : (
        visible.map((entry) =>
          editingId === entry.id ? (
            <PostForm key={entry.id} cat={cat} ui={ui} profile={profile} mode="edit" entry={entry}
              onCancel={() => setEditingId(null)} onSaved={() => { setEditingId(null); load(); }} />
          ) : (
            <div className={`card ${entry.pinned ? "pinned" : ""}`} key={entry.id}>
              <div className="card-head">
                <div>
                  <h3>{entry.pinned ? <span className="pin-flag">📌</span> : null}{entry.title}</h3>
                  <div className="card-meta">
                    {entry.anonymous ? (
                      <span className="tag">🙈 익명</span>
                    ) : (
                      <>
                        <span className="tag">{entry.station}</span>
                        <span className="tag">{entry.role}</span>
                        <span className="tag">{entry.rank}</span>
                        <span className="tag">{entry.author_name}</span>
                      </>
                    )}
                    {entry.extra && <span className="tag">{entry.extra}</span>}
                    {entry.extra2 && <span className="tag">{entry.extra2}</span>}
                    <span>최종수정 {fmtDate(entry.updated_at)}</span>
                  </div>
                </div>
                <div className="card-actions">
                  {isAdmin && (
                    <button className={`icon-btn ${entry.pinned ? "active-pin" : ""}`} onClick={() => togglePin(entry)} title="고정/해제">📌</button>
                  )}
                  {(isAdmin || entry.author_id === profile.id) && (
                    <>
                      <button className="icon-btn" onClick={() => setEditingId(entry.id)} title="수정">✎</button>
                      <button className="icon-btn danger" onClick={() => deletePost(entry)} title="삭제">🗑</button>
                    </>
                  )}
                </div>
              </div>
              <div className="card-body">{entry.content}</div>
              {entry.photo_paths?.length > 0 && (
                <div className="card-photos">
                  {entry.photo_paths.map((p) => photoUrls[p] && <img key={p} src={photoUrls[p]} onClick={() => window.open(photoUrls[p], "_blank")} />)}
                </div>
              )}
              {entry.link && (
                <div style={{ marginTop: 8 }}>
                  <a href={entry.link} target="_blank" rel="noopener noreferrer" className="tag" style={{ textDecoration: "none", display: "inline-block" }}>🔗 첨부 링크 열기</a>
                </div>
              )}
            </div>
          )
        )
      )}
    </div>
  );
}

function StudyTimer({ onStop }: { onStop: (minutes: number) => void }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  function fmt(s: number) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div className="timer-box">
      <div className="timer-display mono">{fmt(seconds)}</div>
      <div className="timer-actions">
        {!running ? (
          <button type="button" className="btn btn-primary btn-small" onClick={() => setRunning(true)}>▶ 시작</button>
        ) : (
          <button type="button" className="btn btn-primary btn-small" onClick={() => setRunning(false)}>⏸ 정지</button>
        )}
        <button type="button" className="btn btn-ghost btn-small" onClick={() => { setRunning(false); setSeconds(0); }}>초기화</button>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          disabled={seconds === 0}
          onClick={() => { setRunning(false); onStop(Math.max(1, Math.round(seconds / 60))); }}
        >
          이 시간 기록하기 →
        </button>
      </div>
      <p style={{ fontSize: 10.5, color: "var(--ink-soft)", margin: "6px 0 0" }}>
        타이머를 안 쓰고 아래 "공부 시간" 칸에 직접 시간을 적으셔도 돼요.
      </p>
    </div>
  );
}

function PostForm({ cat, ui, profile, mode, entry, onCancel, onSaved }: {
  cat: any; ui: any; profile: Profile; mode: "new" | "edit"; entry?: Post; onCancel: () => void; onSaved: () => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [link, setLink] = useState(entry?.link || "");
  const [extra, setExtra] = useState(entry?.extra || (cat.extra?.type === "select" ? cat.extra.options[0] : ""));  const [extra2, setExtra2] = useState(entry?.extra2 || (cat.extra2?.type === "select" ? cat.extra2.options[0] : ""));
  const [anonymous, setAnonymous] = useState(entry?.anonymous || false);
  const [station, setStation] = useState(entry?.station || profile.station || STATIONS[0]);
  const [role, setRole] = useState(entry?.role || profile.role || ROLES[0]);
  const [rank, setRank] = useState(entry?.rank || profile.rank || RANKS[0]);
  const [name, setName] = useState(entry?.author_name || profile.name || "");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [keepPaths, setKeepPaths] = useState<string[]>(entry?.photo_paths || []);
  const [keepUrls, setKeepUrls] = useState<Record<string, string>>({});
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!entry?.photo_paths?.length) return;
    (async () => {
      const entries: [string, string][] = [];
      for (const path of entry.photo_paths) {
        const { data } = await supabase.storage.from("post-photos").createSignedUrl(path, 3600);
        if (data?.signedUrl) entries.push([path, data.signedUrl]);
      }
      setKeepUrls(Object.fromEntries(entries));
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newFiles]);

  const totalPhotos = keepPaths.length + newFiles.length;

  function onPickFiles(fileList: FileList | null) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    const room = MAX_PHOTOS_PER_POST - totalPhotos;
    if (room <= 0) return;
    setNewFiles((prev) => [...prev, ...files.slice(0, room)]);
  }

  async function submit() {
    if (!title.trim() || !content.trim()) { setErr("제목과 내용을 입력해주세요."); return; }
    setSaving(true); setErr("");
    try {
      const uploadedPaths: string[] = [];
      for (const file of newFiles) {
        const blob = await compressImageFile(file);
        const path = `${cat.id}/${uid()}.jpg`;
        const { error } = await supabase.storage.from("post-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        uploadedPaths.push(path);
      }
      const photo_paths = [...keepPaths, ...uploadedPaths];
      const payload = {
        category: cat.id, title: title.trim(), content: content.trim(), link: link.trim() || null,
        extra: extra || null, extra2: extra2 || null, anonymous,
        station, role, rank, author_name: name.trim(), photo_paths,
        updated_at: new Date().toISOString(),
      };
      if (mode === "new") {
        const { error } = await supabase.from("posts").insert({ ...payload, author_id: profile.id, pinned: false });
        if (error) throw error;
      } else if (entry) {
        const { error } = await supabase.from("posts").update(payload).eq("id", entry.id);
        if (error) throw error;
        const removed = (entry.photo_paths || []).filter((p) => !keepPaths.includes(p));
        if (removed.length) await supabase.storage.from("post-photos").remove(removed);
      }
      onSaved();
    } catch (e: any) {
      setErr("저장 중 오류가 발생했습니다: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-card">
      {err && <div className="modal-err">{err}</div>}
      {cat.id === "studytimer" && <StudyTimer onStop={(m) => setExtra(`${m}분`)} />}
      <div className="form-row"><label>제목</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={ui.pTitle} /></div>
      <div className="form-row"><label>내용</label><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={ui.pBody} /></div>
      <div className="form-row"><label>첨부 파일 링크 (선택)</label><input value={link} onChange={(e) => setLink(e.target.value)} placeholder="구글드라이브·네이버클라우드 등 파일 링크 붙여넣기" /></div>

      <div className="form-row">
        <label>사진 첨부 (선택, 최대 {MAX_PHOTOS_PER_POST}장)</label>
        <div className="photo-upload-row">
          {keepPaths.map((p) => (
            <div className="photo-thumb" key={p}>
              {keepUrls[p] && <img src={keepUrls[p]} />}
              <button type="button" className="p-remove" onClick={() => setKeepPaths(keepPaths.filter((x) => x !== p))}>✕</button>
            </div>
          ))}
          {previewUrls.map((u, i) => (
            <div className="photo-thumb" key={u}>
              <img src={u} />
              <button type="button" className="p-remove" onClick={() => setNewFiles(newFiles.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
          {totalPhotos < MAX_PHOTOS_PER_POST && (
            <label className="photo-add-btn">
              <span style={{ fontSize: 18 }}>📷</span>+ 추가
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => onPickFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      {cat.extra && (
        <div className="form-row">
          <label>{cat.extra.label}</label>
          {cat.extra.type === "select" ? (
            <select value={extra} onChange={(e) => setExtra(e.target.value)}>{opts(cat.extra.options)}</select>
          ) : (
            <input type={cat.extra.type} value={extra} onChange={(e) => setExtra(e.target.value)} />
          )}
        </div>
      )}
      {cat.extra2 && (
        <div className="form-row">
          <label>{cat.extra2.label}</label>
          {cat.extra2.type === "select" ? (
            <select value={extra2} onChange={(e) => setExtra2(e.target.value)}>{opts(cat.extra2.options)}</select>
          ) : (
            <input type={cat.extra2.type} value={extra2} onChange={(e) => setExtra2(e.target.value)} />
          )}
        </div>
      )}
      {cat.allowAnonymous && (
        <div className="form-row">
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, fontSize: 12.5 }}>
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} style={{ width: "auto" }} />
            🙈 익명으로 작성 (이름·소속 등이 표시되지 않아요)
          </label>
        </div>
      )}
      {!(cat.allowAnonymous && anonymous) && (
        <div className="grid-4">
          <div><label>소속</label><select value={station} onChange={(e) => setStation(e.target.value)}>{opts(STATIONS)}</select></div>
          <div><label>직책</label><select value={role} onChange={(e) => setRole(e.target.value)}>{opts(ROLES)}</select></div>
          <div><label>계급</label><select value={rank} onChange={(e) => setRank(e.target.value)}>{opts(RANKS)}</select></div>
          <div><label>이름</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" /></div>
        </div>
      )}
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onCancel}>취소</button>
        <button className="btn btn-primary" disabled={saving} onClick={submit}>{saving ? "저장 중..." : mode === "new" ? "등록" : "저장"}</button>
      </div>
    </div>
  );
}
