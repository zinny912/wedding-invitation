// 섹션으로 스무스 스크롤
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth" });
}

// 계좌 토글
function toggleAccount(type) {
  const el = document.getElementById(`account-${type}`);
  if (!el) return;
  const isShown = el.style.display === "block";
  el.style.display = isShown ? "none" : "block";
}

// 텍스트 복사
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("계좌번호가 복사되었습니다."))
      .catch(() => alert("복사 중 오류가 발생했습니다."));
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      alert("계좌번호가 복사되었습니다.");
    } catch (e) {
      alert("복사 중 오류가 발생했습니다.");
    }
    document.body.removeChild(textarea);
  }
}

// ======================
// 갤러리 페이징
// ======================
const TOTAL_IMAGES = 90;   // 전체 사진 개수
const IMAGES_PER_PAGE = 9; // 한 페이지당 9장
const TOTAL_PAGES = Math.ceil(TOTAL_IMAGES / IMAGES_PER_PAGE);

let currentPage = 1;
let currentImageIndex = null; // ✅ 현재 모달에서 보고 있는 사진 번호

function getImagePath(index) {
  // index: 1 ~ 90, 파일명: img01.jpg ~ img90.jpg 기준
  const num = String(index).padStart(2, "0"); // 1 -> "01"
  return `images/gallery/img${num}.jpg`;
}

function renderGalleryPage(page) {
  const startIndex = (page - 1) * IMAGES_PER_PAGE + 1; // 1, 10, 19...
  const items = document.querySelectorAll(".gallery-item");

  items.forEach((img, i) => {
    const imageIndex = startIndex + i; // 실제 사진 번호 (1~90)
    if (imageIndex <= TOTAL_IMAGES) {
      img.style.visibility = "visible";
      img.src = getImagePath(imageIndex);
      img.alt = `우리 사진 ${imageIndex}`;
      img.dataset.index = imageIndex; // ✅ 모달용 번호 저장
    } else {
      img.style.visibility = "hidden";
      img.removeAttribute("src");
      img.removeAttribute("alt");
      img.removeAttribute("data-index");
    }
  });

  const indicator = document.getElementById("gallery-page-indicator");
  if (indicator) {
    indicator.textContent = `${page} / ${TOTAL_PAGES}`;
  }
}

function changeGalleryPage(delta) {
  let nextPage = currentPage + delta;
  if (nextPage < 1) nextPage = 1;
  if (nextPage > TOTAL_PAGES) nextPage = TOTAL_PAGES;
  if (nextPage === currentPage) return;
  currentPage = nextPage;
  renderGalleryPage(currentPage);
}

// ======================
// 모달 + 좌우 이동
// ======================
// const modal = document.getElementById("image-modal");
// const modalImg = document.getElementById("modal-image");

// function openModalWithIndex(index) {
//   if (index < 1 || index > TOTAL_IMAGES) return;
//   currentImageIndex = index;
//   modalImg.src = getImagePath(currentImageIndex);
//   modalImg.alt = `우리 사진 ${currentImageIndex}`;
//   modal.style.display = "flex";
// }

// function closeModal() {
//   modal.style.display = "none";
//   currentImageIndex = null;
// }

// // 이전 사진
// function modalPrev() {
//   if (!currentImageIndex) return;
//   let nextIndex = currentImageIndex - 1;
//   if (nextIndex < 1) nextIndex = 1; // 원하면 TOTAL_IMAGES로 순환도 가능
//   openModalWithIndex(nextIndex);
// }

// // 다음 사진
// function modalNext() {
//   if (!currentImageIndex) return;
//   let nextIndex = currentImageIndex + 1;
//   if (nextIndex > TOTAL_IMAGES) nextIndex = TOTAL_IMAGES; // 원하면 1로 순환도 가능
//   openModalWithIndex(nextIndex);
// }

// ======================
// 초기화 & 이벤트 바인딩
// ======================
document.addEventListener("DOMContentLoaded", () => {
  // 첫 페이지 렌더링
  renderGalleryPage(currentPage);

  // 갤러리 썸네일 클릭 → 모달 열기
  const galleryWrapper = document.querySelector(".gallery-wrapper");
  if (galleryWrapper) {
    galleryWrapper.addEventListener("click", (e) => {
      const target = e.target;
      if (target.classList.contains("gallery-item") && target.dataset.index) {
        const index = Number(target.dataset.index);
        openModalWithIndex(index);   // ✅ 현재 사진 index 기준으로 모달 열기
      }
    });
  }

  // 페이지 이동 버튼
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => changeGalleryPage(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => changeGalleryPage(1));
  }

  // 모달 바깥 클릭 시 닫기
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
});
// ======================================
// 모바일 스와이프 기능
// ======================================
let touchStartX = 0;
let touchEndX = 0;

modal.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

modal.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;

  const diff = touchEndX - touchStartX;

  // 오른쪽 → 왼쪽 스와이프(다음 사진)
  if (diff < -50) {
    modalNext();
  }

  // 왼쪽 → 오른쪽 스와이프(이전 사진)
  if (diff > 50) {
    modalPrev();
  }
});
