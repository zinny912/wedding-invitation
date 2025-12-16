import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider }
  from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  // 🔥 Firebase 콘솔에서 복사한 config
};

const app = initializeApp(firebaseConfig);

// ✅ App Check (여기에 Site key만!)
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LemOi0sAAAAAPVZOM5t0O2XaRtxcGz7TkoO-g7v"),
  isTokenAutoRefreshEnabled: true,
});

const db = getFirestore(app);

// 이후 방명록 JS 로직...
