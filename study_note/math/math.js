export function initMathIndexSearch() {
  const input = document.getElementById("mathSearch");
  const entries = document.querySelectorAll(".math-entry");
  if (!input || !entries.length) return;

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    entries.forEach((el) => {
      const text = el.textContent.toLowerCase();
      const kws = (el.dataset.keywords || "").toLowerCase();
      const match = !q || text.includes(q) || kws.includes(q);
      el.classList.toggle("hidden", !match);
    });
  });
}

export function buildMathToc(container, navEl) {
  if (!container || !navEl) return;

  const headings = container.querySelectorAll("h2, h3");
  if (!headings.length) return;

  const group = document.createElement("div");
  group.className = "group math-toc";
  group.setAttribute("data-open", "true");

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.setAttribute("data-toggle", "");
  toggle.innerHTML = '本页目录 <span class="chev" aria-hidden="true"></span>';

  const submenu = document.createElement("div");
  submenu.className = "submenu";

  headings.forEach((h, i) => {
    if (!h.id) {
      h.id = "sec-" + i;
    }
    const a = document.createElement("a");
    a.href = "#" + h.id;
    a.textContent = h.textContent;
    if (h.tagName === "H3") {
      a.style.paddingLeft = "calc(12px + var(--indent) + 8px)";
      a.style.fontSize = "12px";
    }
    submenu.appendChild(a);
  });

  group.append(toggle, submenu);
  navEl.appendChild(group);
}
