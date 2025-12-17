(() => {
  const hero = document.getElementById("heroSlider");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const imgs = Array.from(hero.querySelectorAll("img.hero-photo"));
  const TOTAL = slides.length;

  const INTERVAL_MS = 3000; // 몇 초마다
  const AFTER_LAST_DELAY = 400;

  let idx = 0;
  let timer = null;
  let unlocked = false;

  // ✅ 스크롤 잠금
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

  // ✅ 이미지 로딩(디코드) 대기
  const waitImages = async () => {
    const tasks = imgs.map(async (img) => {
      // 이미 로드됨
      if (img.complete && img.naturalWidth > 0) return;

      // decode() 지원 브라우저면 우선 사용 (더 안정적)
      if (img.decode) {
        try {
          await img.decode();
          return;
        } catch (e) {
          // decode 실패하면 load 이벤트로 fallback
        }
      }

      await new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true }); // ✅ 에러여도 진행
      });
    });

    await Promise.all(tasks);
  };

  const startSlider = () => {
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
  };

  // ✅ "이미지 다 준비되면" 시작 (그 전엔 슬라이드/스크롤락 안함)
  (async () => {
    setActive(0);            // 첫 장 클래스만 미리
    await waitImages();      // ✅ 전부 로딩/디코드 될 때까지 대기
    startSlider();           // ✅ 그 다음에만 시작
  })();
})();
