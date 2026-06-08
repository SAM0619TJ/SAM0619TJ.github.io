function $(sel, root = document) {
  return root.querySelector(sel);
}
function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
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
  initThemeToggle();
  initGroups();
  initActiveLink();
  initScrollUI();
  initMobileSidebar();
  initSmoothAnchors();
  initReveal();
}
