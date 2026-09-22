function $(sel, root = document) {
  return root.querySelector(sel);
}
function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

const BACKGROUND_SETS = {
  landscape: [
    "../images/image1.jpg",
    "../images/image2.jpg",
    "../images/image3.jpg",
    "../images/image4.jpg",
    "../images/122535213_p0-万事屋すいちゃん.jpg",
    "../images/65913057_p0-水着オルタ.png",
    "../images/122149864_p0-とげなしとげあり.jpg",
    "../images/120064238_p0-GIRLS BAND CRY完结贺图.png",
    "../images/126475690_p0-No longer alone.jpg",
    "../images/57963734_p0-魔女と聖女.png",
  ],
  portrait: [
    "../images/119121286_p0-ガールズバンドクライ.jpg",
    "../images/145762384_p0-冬.jpg",
    "../images/119051947_p0-全部ぶちこめ！.png",
    "../images/59612057_p0-Avalon.png",
  ],
};

// Backward-compatible flat list (defaults to landscape).
const BACKGROUND_IMAGES = BACKGROUND_SETS.landscape;

export function isPortraitViewport(win = globalThis) {
  return !!(win && win.matchMedia && win.matchMedia("(orientation: portrait)").matches);
}

export function selectBackgroundSet(portrait, sets = BACKGROUND_SETS) {
  const list = portrait ? sets.portrait : sets.landscape;
  if (list && list.length) return list;
  return sets.landscape && sets.landscape.length ? sets.landscape : sets.portrait || [];
}

export function chooseRandomBackgroundImage(images = BACKGROUND_IMAGES, random = Math.random) {
  if (!images.length) return "";
  const raw = random();
  const clamped = Math.max(0, Math.min(raw, 0.999999999));
  return images[Math.floor(clamped * images.length)];
}

export function buildCssImageUrl(imagePath, baseUrl = import.meta.url) {
  return `url("${new URL(imagePath, baseUrl).href}")`;
}

export function initRandomBackground({
  doc = globalThis.document,
  win = globalThis,
  images,
  sets = BACKGROUND_SETS,
  portrait,
  random = Math.random,
  baseUrl = import.meta.url,
} = {}) {
  const isPortrait = typeof portrait === "boolean" ? portrait : isPortraitViewport(win);
  const list = Array.isArray(images) ? images : selectBackgroundSet(isPortrait, sets);
  const imagePath = chooseRandomBackgroundImage(list, random);
  if (!imagePath || !doc?.documentElement?.style?.setProperty) return;
  doc.documentElement.style.setProperty("--bg-image", buildCssImageUrl(imagePath, baseUrl));
}

export function initResponsiveBackground({ win = globalThis } = {}) {
  initRandomBackground();
  if (!win.matchMedia) return;
  const mq = win.matchMedia("(orientation: portrait)");
  const onChange = () => initRandomBackground();
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else if (mq.addListener) mq.addListener(onChange);
}

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initThemeToggle() {
  const btn = $("#themeBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const html = document.documentElement;
    const current = html.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("portfolio-theme", next);
  });
}

export function initThemeOnLoad() {
  const userMode = localStorage.getItem("portfolio-theme");
  const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = userMode || (systemDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
}

export function initGroups() {
  $$("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".group");
      if (!group) return;
      const open = group.getAttribute("data-open") === "true";
      group.setAttribute("data-open", String(!open));
    });
  });
}

export function initActiveLink() {
  const nav = $(".nav");
  if (!nav) return;

  function setActiveByUrl() {
    const here = location.pathname.split("/").pop() || "";
    const hash = location.hash || "";
    const search = location.search || "";

    const links = $$("a[href]", nav);
    links.forEach((a) => a.classList.remove("is-active"));

    if (hash) {
      const a = nav.querySelector(`a[href="${CSS.escape(hash)}"]`);
      if (a) {
        a.classList.add("is-active");
        return;
      }
    }

    const pathMatch = links.find((a) => {
      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return false;
      if (href.includes("?") && search) {
        return href.split("/").pop() === here + search;
      }
      const last = href.split("/").pop();
      return last === here;
    });
    if (pathMatch) pathMatch.classList.add("is-active");
  }

  setActiveByUrl();
  window.addEventListener("hashchange", setActiveByUrl);
}

export function initScrollUI() {
  const progress = $("#progress");
  const backTop = $("#backTop");

  function onScroll() {
    const top = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = height > 0 ? (top / height) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
    if (backTop) backTop.classList.toggle("visible", top > 350);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  }
}

export function initMobileSidebar() {
  const toggle = $("#sidebarToggle");
  const backdrop = $("#sidebarBackdrop");

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
  }

  function openSidebar() {
    document.body.classList.add("sidebar-open");
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-open");
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeSidebar);
  }

  $$(".sidebar .nav a").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.innerWidth <= 900) closeSidebar();
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("sidebar-open")) {
      closeSidebar();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeSidebar();
  });
}

export function initSmoothAnchors() {
  $$("a[href^='#']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      const target = href && href.length > 1 ? $(href) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
      history.pushState(null, "", href);
    });
  });
}

export function initReveal() {
  if (prefersReducedMotion()) {
    $$(".reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  $$(".reveal").forEach((el) => observer.observe(el));
}

export function initSidebarUI() {
  initThemeOnLoad();
  initResponsiveBackground();
  initThemeToggle();
  initGroups();
  initActiveLink();
  initScrollUI();
  initMobileSidebar();
  initSmoothAnchors();
  initReveal();
}
