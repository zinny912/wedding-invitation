import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js";

import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot,
  deleteDoc, doc
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

const auth = getAuth(app);
signInAnonymously(auth).catch(console.error);

const db = getFirestore(app);
const guestbookRef = collection(db, "guestbook");

/** ✅ DOM */
const listEl = document.getElementById("guestbookList");
const modal = document.getElementById("gbModal");
const openBtn = document.getElementById("gbOpen");
const closeBtn = document.getElementById("gbClose");
const form = document.getElementById("guestbookForm");
const nameInput = document.getElementById("gbName");
const messageInput = document.getElementById("gbMessage");

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

/** ✅ 목록 실시간 구독 */
const q = query(guestbookRef, orderBy("createdAt", "desc"), limit(50));
let unsub = null;

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  if (unsub) unsub();

  unsub = onSnapshot(q, (snapshot) => {
    listEl.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const docId = docSnap.id;

      const isMine = d.uid && d.uid === user.uid;

      const item = document.createElement("div");
      item.className = "gb-item";
      item.innerHTML = `
        ${isMine ? `<button class="gb-x" type="button" aria-label="삭제">×</button>` : ""}
        <div class="gb-name">${escapeHtml(d.name ?? "")}</div>
        <div class="gb-message">${escapeHtml(d.message ?? "")}</div>
      `;

      if (isMine) {
        item.querySelector(".gb-x")?.addEventListener("click", async () => {
          const ok = confirm("이 글을 삭제할까요?");
          if (!ok) return;

          try {
            await deleteDoc(doc(db, "guestbook", docId));
            // onSnapshot이 알아서 리스트 갱신 → item.remove() 굳이 안 해도 됨
          } catch (err) {
            console.error("deleteDoc 실패:", err);
            alert("삭제 실패: 권한(Rules) 또는 App Check 설정을 확인하세요.");
          }
        });
      }

      listEl.appendChild(item);
    });
  }, (err) => {
    console.error("onSnapshot error:", err);
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
      createdAt: serverTimestamp(), // ✅ 정렬/시간 통일 (이걸로 orderBy)
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
