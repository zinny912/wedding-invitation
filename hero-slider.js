(() => {
  const hero = document.getElementById("heroSlider");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const TOTAL = slides.length;

  const INTERVAL_MS = 3000; // ✅ 여기서 “몇 초마다” 조절 (2.5초)
  const AFTER_LAST_DELAY = 400;

  let idx = 0;
  let timer = null;
  let unlocked = false;

  // ✅ 스크롤 잠금(본문 스크롤 못하게)
  const lockScroll = () => {
    const y = window.scrollY;
    document.body.dataset.lockY = String(y);
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  };

  // ✅ 스크롤 해제
  const unlockScroll = () => {
    if (unlocked) return;
    unlocked = true;

    const y = parseInt(document.body.dataset.lockY || "0", 10);
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, y);
  };

  // iOS 터치 스크롤도 막기
  const preventTouch = (e) => {
    if (!unlocked) e.preventDefault();
  };
  document.addEventListener("touchmove", preventTouch, { passive: false });

  const setActive = (n) => {
    slides.forEach((s, i) => s.classList.toggle("is-active", i === n));
  };

  const finish = () => {
    clearInterval(timer);
    timer = null;
    setTimeout(unlockScroll, AFTER_LAST_DELAY);
  };

  // 시작
  lockScroll();
  setActive(0);

  timer = setInterval(() => {
    idx += 1;
    if (idx >= TOTAL) {
      // ✅ 3장 다 보여주면 스크롤 풀기
      finish();
      return;
    }
    setActive(idx);
  }, INTERVAL_MS);
})();
