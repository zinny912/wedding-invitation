import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js";

import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot,
  deleteDoc, doc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { getAuth, signInAnonymously, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/** ✅ Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyDAtRxJhKtysr03Ofhsve2UUax0F8OMA6o",
  authDomain: "mobile-wedding-card-c9412.firebaseapp.com",
  projectId: "mobile-wedding-card-c9412",
  storageBucket: "mobile-wedding-card-c9412.firebasestorage.app",
  messagingSenderId: "480729498294",
  appId: "1:480729498294:web:3c0ca297773c5bf7825c17",
  measurementId: "G-QWF0GK1X02"
};

const app = initializeApp(firebaseConfig);

/** ✅ App Check */
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LemOi0sAAAAAPVZOM5t0O2XaRtxcGz7TkoO-g7v"),
  isTokenAutoRefreshEnabled: true,
});

/** ✅ Auth (익명 로그인) */
const auth = getAuth(app);
signInAnonymously(auth).catch(console.error);

/** ✅ Firestore */
const db = getFirestore(app);
const guestbookRef = collection(db, "guestbook");

/** ✅ DOM */
const listEl = document.getElementById("guestbookList");
const moreBtn = document.getElementById("gbMore");

const modal = document.getElementById("gbModal");
const openBtn = document.getElementById("gbOpen");
const closeBtn = document.getElementById("gbClose");
const form = document.getElementById("guestbookForm");
const nameInput = document.getElementById("gbName");
const messageInput = document.getElementById("gbMessage");

if (!listEl || !modal || !openBtn || !closeBtn || !form || !nameInput || !messageInput || !moreBtn) {
  console.error("방명록 HTML 요소(ID)가 누락됐습니다.", {
    guestbookList: !!listEl,
    gbModal: !!modal,
    gbOpen: !!openBtn,
    gbClose: !!closeBtn,
    guestbookForm: !!form,
    gbName: !!nameInput,
    gbMessage: !!messageInput,
    gbMore: !!moreBtn,
  });
}

/** ✅ 더보기 상태 */
let allDocs = [];       // {id, data} 배열
let visibleCount = 5;   // 처음 5개

/** ✅ Timestamp -> "YYYY.MM.DD HH:mm" */
function formatKST(ts) {
  if (!ts) return "";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

/** ✅ 렌더링 (5개씩) */
function renderGuestbook(user) {
  if (!listEl) return;

  listEl.innerHTML = "";

  // 현재 보여줄 만큼만
  const slice = allDocs.slice(0, visibleCount);

  slice.forEach(({ id, data }) => {
    const isMine = data.uid && user && data.uid === user.uid;

    // createdAt = serverTimestamp() 기반
    const createdAt = data.createdAt || null;

    const item = document.createElement("div");
    item.className = "gb-item";
    item.innerHTML = `
      ${isMine ? `<button class="gb-x" type="button" aria-label="삭제">×</button>` : ""}

      <div class="gb-topline">
        <div class="gb-name">${escapeHtml(data.name ?? "")}</div>
        <div class="gb-time">${escapeHtml(formatKST(createdAt))}</div>
      </div>

      <div class="gb-message">${escapeHtml(data.message ?? "")}</div>
    `;

    if (isMine) {
      item.querySelector(".gb-x")?.addEventListener("click", async () => {
        const ok = confirm("이 글을 삭제할까요?");
        if (!ok) return;

        try {
          await deleteDoc(doc(db, "guestbook", id));
          // onSnapshot이 알아서 갱신해줌
        } catch (err) {
          console.error("deleteDoc 실패:", err);
          alert("삭제 실패: 권한(Rules) 또는 App Check 설정을 확인하세요.");
        }
      });
    }

    listEl.appendChild(item);
  });

  // ✅ 더 이상 없으면 더보기 숨김
  if (moreBtn) moreBtn.hidden = allDocs.length <= visibleCount;
}

/** ✅ 더보기 클릭 시 +5 */
moreBtn?.addEventListener("click", () => {
  visibleCount += 5;
  renderGuestbook(auth.currentUser);
});

/** ✅ 목록 실시간 구독 (최신순) */
const q = query(guestbookRef, orderBy("createdAt", "desc"), limit(50));
let unsub = null;

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  if (unsub) unsub();

  unsub = onSnapshot(q, (snapshot) => {
    allDocs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      data: docSnap.data(),
    }));

    // ✅ 스냅샷이 갱신돼도 “지금 보고 있던 개수”를 유지하고 싶으면 아래 2줄 중 1개만 선택
    // (A) 항상 5개로 리셋:
    // visibleCount = 5;

    // (B) 보고 있던 개수 유지(추천):
    visibleCount = Math.min(Math.max(visibleCount, 5), allDocs.length);

    renderGuestbook(user);
  }, (err) => {
    console.error("onSnapshot error:", err);
    alert(err?.message || String(err));
  });
});

/** ✅ 모달 */
openBtn?.addEventListener("click", () => modal.classList.add("open"));
closeBtn?.addEventListener("click", () => modal.classList.remove("open"));
modal?.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });

/** ✅ 작성 */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (!name || !message) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    await addDoc(guestbookRef, {
      name,
      message,
      uid: auth.currentUser.uid,
      createdAt: Timestamp.now(),
    });

    messageInput.value = "";
    modal.classList.remove("open");
  } catch (err) {
    console.error("addDoc 실패:", err);
    alert("방명록 저장 실패: 권한(App Check/Rules) 또는 설정 문제입니다.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

/** ✅ XSS 방지 */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[c]));
}
