/* =========================================================
   红莲魔尊 · 同人商店页面交互
   纯原生 JS，无依赖，无网络请求
   ========================================================= */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---------- 提示条 ---------- */
  var toastEl = $("[data-toast]");
  var toastTimer = null;

  function toast(message) {
    if (!toastEl) { return; }
    toastEl.textContent = message;
    toastEl.hidden = false;
    if (toastTimer) { window.clearTimeout(toastTimer); }
    toastTimer = window.setTimeout(function () {
      toastEl.hidden = true;
    }, 2800);
  }

  /* ---------- 图片轮播 ---------- */
  var viewerImg = $("[data-viewer-img]");
  var viewerBadge = $("[data-viewer-badge]");
  var viewerCaption = $("[data-viewer-caption]");
  var thumbs = $$(".thumb");
  var current = 0;

  var slides = thumbs.map(function (btn, i) {
    var img = $("img", btn);
    return {
      index: i,
      full: btn.getAttribute("data-full"),
      caption: btn.getAttribute("data-caption") || "",
      alt: img ? img.getAttribute("alt") || "" : ""
    };
  });

  function renderSlide(index) {
    if (!slides.length) { return; }
    current = (index + slides.length) % slides.length;
    var slide = slides[current];

    if (viewerImg) {
      viewerImg.src = slide.full;
      viewerImg.alt = slide.alt;
    }
    if (viewerBadge) {
      viewerBadge.textContent = (current + 1) + " / " + slides.length;
    }
    if (viewerCaption) {
      viewerCaption.textContent = slide.caption;
    }
    thumbs.forEach(function (btn, i) {
      var active = i === current;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-current", active ? "true" : "false");
    });

    if (lightboxImg && !lightboxEl.hidden) {
      lightboxImg.src = slide.full;
      lightboxImg.alt = slide.alt;
      if (lightboxCaption) { lightboxCaption.textContent = slide.caption; }
    }
  }

  thumbs.forEach(function (btn, i) {
    btn.addEventListener("click", function () { renderSlide(i); });
  });

  var prevBtn = $("[data-prev]");
  var nextBtn = $("[data-next]");
  if (prevBtn) { prevBtn.addEventListener("click", function () { renderSlide(current - 1); }); }
  if (nextBtn) { nextBtn.addEventListener("click", function () { renderSlide(current + 1); }); }

  /* ---------- 全屏查看 ---------- */
  var lightboxEl = $("[data-lightbox]");
  var lightboxImg = $("[data-lightbox-img]");
  var lightboxCaption = $("[data-lightbox-caption]");
  var lastFocus = null;

  function openLightbox() {
    if (!lightboxEl) { return; }
    lastFocus = document.activeElement;
    lightboxEl.hidden = false;
    document.body.style.overflow = "hidden";
    renderSlide(current);
    var closeBtn = $("[data-lightbox-close]");
    if (closeBtn) { closeBtn.focus(); }
  }

  function closeLightbox() {
    if (!lightboxEl || lightboxEl.hidden) { return; }
    lightboxEl.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  var expandBtn = $("[data-expand]");
  if (expandBtn) { expandBtn.addEventListener("click", openLightbox); }

  var lightboxClose = $("[data-lightbox-close]");
  if (lightboxClose) { lightboxClose.addEventListener("click", closeLightbox); }

  var lightboxPrev = $("[data-lightbox-prev]");
  var lightboxNext = $("[data-lightbox-next]");
  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", function () { renderSlide(current - 1); });
  }
  if (lightboxNext) {
    lightboxNext.addEventListener("click", function () { renderSlide(current + 1); });
  }
  if (lightboxEl) {
    lightboxEl.addEventListener("click", function (event) {
      if (event.target === lightboxEl) { closeLightbox(); }
    });
  }

  var stageImg = $("[data-viewer-img]");
  if (stageImg) {
    stageImg.addEventListener("click", openLightbox);
  }

  /* ---------- 购物车弹层 ---------- */
  var modal = $("[data-modal]");
  var modalFocusReturn = null;

  function openModal() {
    if (!modal) { return; }
    modalFocusReturn = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var closeBtn = $(".modal-close", modal);
    if (closeBtn) { closeBtn.focus(); }
  }

  function closeModal() {
    if (!modal || modal.hidden) { return; }
    modal.hidden = true;
    document.body.style.overflow = "";
    if (modalFocusReturn && modalFocusReturn.focus) { modalFocusReturn.focus(); }
  }

  $$("[data-modal-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  var addCart = $("[data-add-cart]");
  if (addCart) {
    addCart.addEventListener("click", function () {
      openModal();
      toast("已加入购物车（同人演示，不会产生真实订单）");
    });
  }

  var cartView = $("[data-cart-view]");
  if (cartView) {
    cartView.addEventListener("click", function () {
      closeModal();
      toast("同人演示：购物车、结算与支付流程均未接入");
    });
  }

  /* ---------- 愿望单 ---------- */
  var wished = false;
  var wishButtons = $$("[data-wishlist]");
  var wishLabels = $$("[data-wishlist-label]");

  wishButtons.forEach(function (btn) {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () {
      wished = !wished;
      wishButtons.forEach(function (b) {
        b.classList.toggle("is-on", wished);
        b.setAttribute("aria-pressed", wished ? "true" : "false");
      });
      wishLabels.forEach(function (label) {
        label.textContent = wished ? "已在愿望单中" : "加入愿望单";
      });
      toast(wished ? "已加入愿望单：红莲魔尊" : "已从愿望单移除");
    });
  });

  /* ---------- 关注 / 忽略 ---------- */
  var followBtn = $("[data-follow]");
  if (followBtn) {
    var followed = false;
    followBtn.setAttribute("aria-pressed", "false");
    followBtn.addEventListener("click", function () {
      followed = !followed;
      followBtn.classList.toggle("is-on", followed);
      followBtn.setAttribute("aria-pressed", followed ? "true" : "false");
      followBtn.textContent = followed ? "已关注" : "关注";
      toast(followed ? "已关注红莲魔尊的更新" : "已取消关注");
    });
  }

  var ignoreBtn = $("[data-ignore]");
  if (ignoreBtn) {
    ignoreBtn.addEventListener("click", function () {
      toast("同人演示：忽略后不再推荐此商品（不会真的生效）");
    });
  }

  var trailerBtn = $("[data-trailer]");
  if (trailerBtn) {
    trailerBtn.addEventListener("click", function () {
      toast("同人演示：预告片未接入视频文件，可先看下方六张画面");
    });
  }

  /* ---------- 评测筛选 ---------- */
  var filterButtons = $$("[data-filter]");
  var reviews = $$("[data-recommend]");

  function updateCounts() {
    var counts = { all: reviews.length, yes: 0, no: 0 };
    reviews.forEach(function (item) {
      var key = item.getAttribute("data-recommend");
      if (counts[key] !== undefined) { counts[key] += 1; }
    });
    Object.keys(counts).forEach(function (key) {
      var target = $('[data-count="' + key + '"]');
      if (target) { target.textContent = String(counts[key]); }
    });
  }

  function applyFilter(filter) {
    var visible = 0;
    reviews.forEach(function (item) {
      var show = filter === "all" || item.getAttribute("data-recommend") === filter;
      item.hidden = !show;
      if (show) { visible += 1; }
    });
    var empty = $("[data-review-empty]");
    if (empty) { empty.hidden = visible !== 0; }
    filterButtons.forEach(function (btn) {
      var active = btn.getAttribute("data-filter") === filter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyFilter(btn.getAttribute("data-filter"));
    });
  });

  updateCounts();

  /* ---------- 评测「有帮助」 ---------- */
  $$("[data-help]").forEach(function (btn) {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () {
      var numEl = $("span", btn);
      var on = btn.classList.toggle("is-on");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (!numEl) { return; }
      var value = parseInt(numEl.textContent.replace(/[^\d]/g, ""), 10) || 0;
      value += on ? 1 : -1;
      if (value < 0) { value = 0; }
      numEl.textContent = String(value);
    });
  });

  /* ---------- 顶栏与页面小交互 ---------- */
  var tagAdd = $("[data-tag-add]");
  if (tagAdd) {
    tagAdd.addEventListener("click", function () {
      toast("同人演示：自定义标签未接入后端，需要的话可以直接改 index.html");
    });
  }

  var searchForm = $("[data-search-form]");
  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = $("input", searchForm);
      var q = input ? input.value.trim() : "";
      toast(q
        ? "同人演示页面，没有真实搜索结果：“" + q + "”"
        : "请输入关键词，例如「红莲蛊」「五域」「天劫」");
    });
  }

  var loginBtn = $("[data-login]");
  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      toast("同人演示：未接入登录，访客身份已足够读完整页");
    });
  }

  var langBtn = $("[data-lang]");
  if (langBtn) {
    langBtn.addEventListener("click", function () {
      toast("同人演示：语言与货币切换未接入");
    });
  }

  /* ---------- 键盘支持 ---------- */
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeLightbox();
      closeModal();
      return;
    }
    if (lightboxEl && !lightboxEl.hidden) {
      if (event.key === "ArrowLeft") { renderSlide(current - 1); }
      if (event.key === "ArrowRight") { renderSlide(current + 1); }
    }
  });

  /* ---------- 初始化 ---------- */
  renderSlide(0);
  applyFilter("all");
})();
