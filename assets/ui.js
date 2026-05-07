function $(sel, root = document) {
  return root.querySelector(sel);
}
function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

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

    const links = $$("a[href]", nav);
    links.forEach((a) => a.classList.remove("is-active"));

    // Prefer hash match
    if (hash) {
      const a = nav.querySelector(`a[href="${CSS.escape(hash)}"]`);
      if (a) {
        a.classList.add("is-active");
        return;
      }
    }

    // Then pathname match (last segment)
    const pathMatch = links.find((a) => {
      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return false;
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

  if (backTop) backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

export function initMobileSidebar() {
  const toggle = $("#sidebarToggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });
}

export function initSmoothAnchors() {
  $$("a[href^='#']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      const target = href && href.length > 1 ? $(href) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", href);
    });
  });
}

export function initSidebarUI() {
  initThemeOnLoad();
  initThemeToggle();
  initGroups();
  initActiveLink();
  initScrollUI();
  initMobileSidebar();
  initSmoothAnchors();
}

