import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { getAuth, signInAnonymously, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/** ✅ 1) Firebase 콘솔(프로젝트 설정 > 내 앱 > 구성)에서 복사해서 넣으세요 */
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

/** ✅ 2) App Check (Site key) */
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LemOi0sAAAAAPVZOM5t0O2XaRtxcGz7TkoO-g7v"),
  isTokenAutoRefreshEnabled: true,
});

const auth = getAuth(app);
signInAnonymously(auth).catch(console.error);

const db = getFirestore(app);
const guestbookRef = collection(db, "guestbook");

/** ✅ 3) DOM 연결 (ID가 HTML에 있어야 합니다) */
const listEl = document.getElementById("guestbookList");
const modal = document.getElementById("gbModal");
const openBtn = document.getElementById("gbOpen");
const closeBtn = document.getElementById("gbClose");
const form = document.getElementById("guestbookForm");
const nameInput = document.getElementById("gbName");
const messageInput = document.getElementById("gbMessage");

/** ✅ 4) 필수 요소가 없으면 바로 알려주기(조용히 실패 방지) */
if (!listEl || !modal || !openBtn || !closeBtn || !form || !nameInput || !messageInput) {
  console.error("방명록 HTML 요소(ID)가 누락됐습니다.", {
    guestbookList: !!listEl,
    gbModal: !!modal,
    gbOpen: !!openBtn,
    gbClose: !!closeBtn,
    guestbookForm: !!form,
    gbName: !!nameInput,
    gbMessage: !!messageInput,
  });
}



const HIDDEN_KEY = "gb_hidden_ids_v1";

function getHiddenSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function hideDocId(docId) {
  const s = getHiddenSet();
  s.add(docId);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...s]));
}


/** ✅ 5) 목록 실시간 구독 */
const q = query(guestbookRef, orderBy("createdAt", "desc"), limit(50));

let unsub = null;

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  // 중복 구독 방지
  if (unsub) unsub();

  unsub = onSnapshot(q, (snapshot) => {
    const hidden = getHiddenSet();
    listEl.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const docId = docSnap.id;

      // ✅ 내 기기에서 숨긴 글은 렌더링 안 함
      if (hidden.has(docId)) return;

      const isMine = d.uid && d.uid === user.uid;

      const item = document.createElement("div");
      item.className = "gb-item";
      item.innerHTML = `
        ${isMine ? `<button class="gb-x" type="button" aria-label="숨기기">×</button>` : ""}
        <div class="gb-name">${escapeHtml(d.name ?? "")}</div>
        <div class="gb-message">${escapeHtml(d.message ?? "")}</div>
      `;

      if (isMine) {
        item.querySelector(".gb-x").addEventListener("click", () => {
          // ✅ DB 삭제가 아니라 “내 화면에서만 숨김”
          hideDocId(docId);
          item.remove();
        });
      }

      listEl.appendChild(item);
    });
  }, (err) => {
    console.error("onSnapshot error:", err);
  });
});

/** ✅ 6) 모달 */
openBtn?.addEventListener("click", () => modal.classList.add("open"));
closeBtn?.addEventListener("click", () => modal.classList.remove("open"));
modal?.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });

/** ✅ 7) 작성 */
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
      uid: auth.currentUser.uid,      // ✅ 내 글 식별
      createdAt: new Date(),
      serverCreatedAt: serverTimestamp(),
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

/** ✅ 8) XSS 방지 */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[c]));
}

