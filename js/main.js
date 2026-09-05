/* ==========================================================================
   SRI RAM ENERGY SPACE SYSTEM — main.js
   Handles: header scroll state, mobile nav, scroll-reveal, animated counters,
   hero particles, WhatsApp/Call links, contact form, projects (fetch +
   pagination + modal), and the admin dashboard (auth + CRUD).

   Backend: Google Apps Script Web App (see /apps-script folder + README).
   Set GOOGLE_SCRIPT_URL below once you deploy the Apps Script Web App.
   ========================================================================== */

const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";

const COMPANY = {
  name: "Sri Ram Energy Space System",
  phone: "8917270469",
  whatsappPhone: "918917270469", // country code + number, digits only
  email: "info@sriramrnergyspacesystem.com",
};

/* -------------------------------------------------------------------- */
/*  Utilities                                                            */
/* -------------------------------------------------------------------- */
function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

function waLink(message) {
  const msg = encodeURIComponent(message || "Hello Sri Ram Energy Space System, I would like to know more about your solar energy solutions.");
  return `https://wa.me/${COMPANY.whatsappPhone}?text=${msg}`;
}

async function callGAS(action, payload, method) {
  method = method || (payload ? "POST" : "GET");
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.indexOf("YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") !== -1) {
    throw new Error("GAS_NOT_CONFIGURED");
  }
  const url = method === "GET"
    ? `${GOOGLE_SCRIPT_URL}?action=${encodeURIComponent(action)}`
    : GOOGLE_SCRIPT_URL;
  const opts = { method };
  if (method === "POST") {
    opts.headers = { "Content-Type": "text/plain;charset=utf-8" }; // avoids CORS preflight on Apps Script
    opts.body = JSON.stringify(Object.assign({ action }, payload || {}));
  }
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error("NETWORK_ERROR");
  return res.json();
}

/* -------------------------------------------------------------------- */
/*  Header: scroll state + compact on scroll                            */
/* -------------------------------------------------------------------- */
function initHeader() {
  const header = qs(".site-header");
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 30) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const path = location.pathname.replace(/\/index\.html$/, "/");
  qsa(".main-nav a, .mobile-nav a").forEach(a => {
    const href = a.getAttribute("href") || "";
    if (href !== "#" && path.endsWith(href.replace(/^(\.\.\/)+/, "/")) ) a.classList.add("active");
  });
}

/* -------------------------------------------------------------------- */
/*  Mobile navigation                                                    */
/* -------------------------------------------------------------------- */
function initMobileNav() {
  const btn = qs(".hamburger");
  const nav = qs(".mobile-nav");
  if (!btn || !nav) return;
  const toggle = (open) => {
    const isOpen = open !== undefined ? open : !nav.classList.contains("open");
    nav.classList.toggle("open", isOpen);
    btn.classList.toggle("open", isOpen);
    document.body.classList.toggle("nav-open", isOpen);
    btn.setAttribute("aria-expanded", String(isOpen));
  };
  btn.addEventListener("click", () => toggle());
  qsa("a", nav).forEach(a => a.addEventListener("click", () => toggle(false)));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
}

/* -------------------------------------------------------------------- */
/*  Scroll reveal (IntersectionObserver)                                 */
/* -------------------------------------------------------------------- */
function initReveal() {
  const items = qsa(".reveal, .reveal-scale");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach(i => i.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  items.forEach(i => io.observe(i));

  qsa(".stagger").forEach(group => {
    Array.from(group.children).forEach((child, i) => child.style.setProperty("--i", i));
  });
}

/* -------------------------------------------------------------------- */
/*  Animated counters                                                    */
/* -------------------------------------------------------------------- */
function initCounters() {
  const counters = qsa("[data-counter]");
  if (!counters.length) return;
  const animate = (el) => {
    const target = parseFloat(el.getAttribute("data-counter"));
    const suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return; // non-numeric labels (e.g. "Clean") stay static
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => io.observe(c));
}

/* -------------------------------------------------------------------- */
/*  Hero floating solar particles (lightweight, CSS-driven)              */
/* -------------------------------------------------------------------- */
function initHeroParticles() {
  const field = qs("[data-particle-field]");
  if (!field) return;
  const count = window.innerWidth < 600 ? 10 : 20;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "hero-particle";
    const size = 3 + Math.random() * 5;
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "%";
    p.style.bottom = -20 + "px";
    p.style.animationDuration = (10 + Math.random() * 12) + "s";
    p.style.animationDelay = (Math.random() * 12) + "s";
    field.appendChild(p);
  }
}

/* -------------------------------------------------------------------- */
/*  WhatsApp / Call links + footer year                                  */
/* -------------------------------------------------------------------- */
function initContactLinks() {
  qsa("[data-wa]").forEach(a => { a.href = waLink(a.getAttribute("data-wa") || undefined); });
  qsa("[data-call]").forEach(a => { a.href = `tel:${COMPANY.phone}`; });
  qsa("[data-mail]").forEach(a => { a.href = `mailto:${COMPANY.email}`; });
  const yearEl = qs("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* -------------------------------------------------------------------- */
/*  Contact form                                                         */
/* -------------------------------------------------------------------- */
function initContactForm() {
  const form = qs("#contact-form");
  if (!form) return;
  const status = qs("#contact-status");
  const showStatus = (ok, msg) => {
    status.textContent = msg;
    status.className = "form-status show " + (ok ? "ok" : "err");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type=submit]");
    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
    };
    if (!data.name || !data.phone || !data.message) {
      showStatus(false, "Please fill in your name, phone and message.");
      return;
    }
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    try {
      const res = await callGAS("sendMessage", data, "POST");
      if (res && res.success) {
        showStatus(true, "Thank you for contacting Sri Ram Energy Space System. Our team will get back to you soon.");
        form.reset();
      } else {
        showStatus(false, (res && res.message) || "Unable to send your message right now. Please try again or contact us on WhatsApp.");
      }
    } catch (err) {
      showStatus(false, "Unable to send your message right now. Please try again or contact us on WhatsApp.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

/* -------------------------------------------------------------------- */
/*  Projects: fetch, paginate, modal                                     */
/* -------------------------------------------------------------------- */
const PROJECTS_PER_PAGE = 6;
let allProjects = [];
let currentPage = 1;

function skeletonCard() {
  return `<div class="skeleton-card">
    <div class="skeleton skeleton-thumb"></div>
    <div class="skeleton skeleton-line w90"></div>
    <div class="skeleton skeleton-line w60"></div>
  </div>`;
}

function renderSkeletons(grid) {
  grid.innerHTML = Array.from({ length: 6 }).map(skeletonCard).join("");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function excerpt(text, len) {
  if (!text) return "";
  return text.length > len ? text.slice(0, len).trim() + "…" : text;
}

function renderProjectCard(p) {
  const img = p.image || p.image_url || "../images/logo.png";
  return `<article class="project-card reveal" data-id="${p.project_id}">
    <div class="project-thumb"><img src="${img}" alt="${p.title}" loading="lazy" onerror="this.src='../images/logo.png'"></div>
    <div class="project-body">
      <h3>${p.title}</h3>
      <p class="story-ex">${excerpt(p.story, 90)}</p>
      <span class="read-more">Read More →</span>
    </div>
  </article>`;
}

function sortProjects(list) {
  return list.slice().sort((a, b) => {
    const da = new Date(a.updated_at || a.created_at || 0).getTime();
    const db = new Date(b.updated_at || b.created_at || 0).getTime();
    return db - da;
  });
}

function renderPage(grid, pag, page, userTriggered) {
  currentPage = page;
  const total = Math.ceil(allProjects.length / PROJECTS_PER_PAGE) || 1;
  const start = (page - 1) * PROJECTS_PER_PAGE;
  const items = allProjects.slice(start, start + PROJECTS_PER_PAGE);

  grid.style.opacity = 0;
  setTimeout(() => {
    grid.innerHTML = items.length
      ? items.map(renderProjectCard).join("")
      : `<div class="projects-empty">No projects have been added yet.</div>`;
    grid.style.opacity = 1;
    qsa(".project-card", grid).forEach(c => c.classList.add("in"));
    qsa(".project-card", grid).forEach(c => c.addEventListener("click", () => openProjectModal(c.dataset.id)));
    renderPagination(pag, page, total);
    // Only auto-scroll when the person actively changes pages — never on first load.
    if (userTriggered) {
      const section = qs("#projects-section");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 180);
}

function renderPagination(pag, page, total) {
  if (!pag) return;
  let html = `<button class="page-btn" data-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Previous page">Previous</button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn ${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" data-page="${page + 1}" ${page === total ? "disabled" : ""} aria-label="Next page">Next</button>`;
  pag.innerHTML = html;
  qsa(".page-btn", pag).forEach(btn => {
    btn.addEventListener("click", () => {
      const p = parseInt(btn.dataset.page, 10);
      if (p >= 1 && p <= total) renderPage(qs("#projects-grid"), pag, p, true);
    });
  });
}

function openProjectModal(id) {
  const p = allProjects.find(x => String(x.project_id) === String(id));
  if (!p) return;
  const overlay = qs("#project-modal");
  if (!overlay) return;
  qs("[data-modal-img]", overlay).src = p.image || p.image_url || "../images/logo.png";
  qs("[data-modal-title]", overlay).textContent = p.title;
  qs("[data-modal-date]", overlay).textContent = formatDate(p.updated_at || p.created_at);
  qs("[data-modal-story]", overlay).textContent = p.story;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(overlay) {
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

async function initProjects() {
  const grid = qs("#projects-grid");
  if (!grid) return;
  const pag = qs("#projects-pagination");
  renderSkeletons(grid);

  try {
    const res = await callGAS("getProjects", null, "GET");
    if (!res || !res.success) throw new Error("API_ERROR");
    allProjects = sortProjects(res.data || []);
  } catch (err) {
    if (err.message === "GAS_NOT_CONFIGURED") {
      // Demo/sample data so the layout can be reviewed before the backend is connected.
      allProjects = sortProjects(SAMPLE_PROJECTS);
    } else {
      grid.innerHTML = `<div class="projects-error">Projects are temporarily unavailable. Please check back shortly.</div>`;
      return;
    }
  }
  renderPage(grid, pag, 1);

  const overlay = qs("#project-modal");
  if (overlay) {
    qs("[data-modal-close]", overlay).addEventListener("click", () => closeModal(overlay));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(overlay); });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(overlay); });
  }
}

// Sample data — clearly marked as placeholder, shown only when Apps Script is not yet configured.
const SAMPLE_PROJECTS = [
  { project_id: "SAMPLE1", title: "Residential Rooftop Installation — Kendrapara", story: "A 5kW rooftop solar system installed for a family home, reducing their monthly electricity bill significantly while providing clean, reliable power. (Sample project — replace with real data via the admin panel.)", image: "", created_at: "2026-08-20", updated_at: "2026-08-20" },
  { project_id: "SAMPLE2", title: "Commercial Solar Setup — Bhubaneswar", story: "A commercial-scale solar installation for a local business, designed to lower operating costs and support sustainable operations. (Sample project — replace with real data via the admin panel.)", image: "", created_at: "2026-07-15", updated_at: "2026-07-15" },
  { project_id: "SAMPLE3", title: "Solar Water Pumping System", story: "An off-grid solar pumping solution supporting agricultural irrigation for a farm near Kendrapara. (Sample project — replace with real data via the admin panel.)", image: "", created_at: "2026-06-02", updated_at: "2026-06-02" },
];

/* -------------------------------------------------------------------- */
/*  Admin panel                                                          */
/* -------------------------------------------------------------------- */
function adminToken() { return sessionStorage.getItem("srees_admin_token") || ""; }
function setAdminToken(t) { sessionStorage.setItem("srees_admin_token", t); }
function clearAdminToken() { sessionStorage.removeItem("srees_admin_token"); }

function toast(msg, ok) {
  let box = qs("#toast-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast-box";
    box.style.cssText = "position:fixed;top:20px;right:20px;z-index:3000;display:flex;flex-direction:column;gap:10px;";
    document.body.appendChild(box);
  }
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = `padding:14px 20px;border-radius:12px;font-weight:600;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.2);background:${ok ? "#18A558" : "#E4453A"};opacity:0;transform:translateY(-8px);transition:all .3s;`;
  box.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = 1; t.style.transform = "none"; });
  setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 3200);
}

function initAdmin() {
  const loginScreen = qs("#admin-login");
  const dashboard = qs("#admin-dashboard");
  if (!loginScreen || !dashboard) return;

  const showDashboard = () => { loginScreen.style.display = "none"; dashboard.style.display = "flex"; loadDashboardData(); };
  const showLogin = () => { dashboard.style.display = "none"; loginScreen.style.display = "flex"; };

  if (adminToken()) showDashboard(); else showLogin();

  qs("#admin-login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Signing in...";
    try {
      const res = await callGAS("login", { username: form.username.value.trim(), password: form.password.value }, "POST");
      if (res && res.success && res.data && res.data.token) {
        setAdminToken(res.data.token);
        toast("Welcome back, " + (res.data.name || "Admin"), true);
        showDashboard();
      } else {
        toast((res && res.message) || "Invalid username or password.", false);
      }
    } catch (err) {
      toast(err.message === "GAS_NOT_CONFIGURED"
        ? "Connect Google Apps Script (see README) to enable admin login."
        : "Unable to reach the server. Please try again.", false);
    } finally {
      btn.disabled = false; btn.textContent = "Login";
    }
  });

  qsa("[data-logout]").forEach(b => b.addEventListener("click", () => {
    clearAdminToken();
    showLogin();
  }));

  qsa("[data-tab]").forEach(tabBtn => {
    tabBtn.addEventListener("click", () => {
      qsa("[data-tab]").forEach(b => b.classList.remove("active"));
      qsa("[data-panel]").forEach(p => p.style.display = "none");
      tabBtn.classList.add("active");
      qs(`[data-panel="${tabBtn.dataset.tab}"]`).style.display = "block";
    });
  });

  async function loadDashboardData() {
    try {
      const res = await callGAS("getProjects", null, "GET");
      const projects = (res && res.success) ? res.data : SAMPLE_PROJECTS;
      renderAdminStats(projects);
      renderAdminTable(projects);
    } catch (err) {
      renderAdminStats(SAMPLE_PROJECTS);
      renderAdminTable(SAMPLE_PROJECTS);
    }
  }

  function renderAdminStats(projects) {
    qs("#stat-total") && (qs("#stat-total").textContent = projects.length);
    qs("#stat-active") && (qs("#stat-active").textContent = projects.filter(p => (p.status || "active") === "active").length);
    const sorted = sortProjects(projects);
    qs("#stat-latest") && (qs("#stat-latest").textContent = sorted[0] ? sorted[0].title : "—");
  }

  function renderAdminTable(projects) {
    const tbody = qs("#admin-projects-body");
    if (!tbody) return;
    const sorted = sortProjects(projects);
    tbody.innerHTML = sorted.map(p => `
      <tr data-id="${p.project_id}">
        <td><img src="${p.image || p.image_url || '../images/logo.png'}" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:8px;" onerror="this.src='../images/logo.png'"></td>
        <td>${p.title}</td>
        <td>${formatDate(p.created_at)}</td>
        <td>${formatDate(p.updated_at)}</td>
        <td><span style="padding:4px 10px;border-radius:999px;background:rgba(24,165,88,.12);color:#0f6b3a;font-size:.8rem;font-weight:700;">${p.status || "active"}</span></td>
        <td>
          <button class="btn btn-ghost btn-sm" data-edit="${p.project_id}">Edit</button>
          <button class="btn btn-ghost btn-sm" data-delete="${p.project_id}">Delete</button>
        </td>
      </tr>`).join("");

    qsa("[data-delete]", tbody).forEach(b => b.addEventListener("click", () => confirmDelete(b.dataset.delete)));
    qsa("[data-edit]", tbody).forEach(b => b.addEventListener("click", () => openEditForm(b.dataset.edit, projects)));
  }

  function confirmDelete(id) {
    const dlg = qs("#confirm-dialog");
    dlg.classList.add("open");
    dlg.querySelector("[data-confirm-yes]").onclick = async () => {
      dlg.classList.remove("open");
      try {
        const res = await callGAS("deleteProject", { token: adminToken(), project_id: id }, "POST");
        if (res && res.success) { toast("Project deleted.", true); loadDashboardData(); }
        else toast((res && res.message) || "Unable to delete project.", false);
      } catch (err) { toast("Unable to reach the server.", false); }
    };
    dlg.querySelector("[data-confirm-no]").onclick = () => dlg.classList.remove("open");
  }

  function openEditForm(id, projects) {
    const p = projects.find(x => String(x.project_id) === String(id));
    if (!p) return;
    const form = qs("#project-form");
    form.dataset.editId = id;
    form.title.value = p.title;
    form.story.value = p.story;
    qs("#project-form-heading").textContent = "Edit Project";
    qs('[data-tab="add-project"]').click();
  }

  const projectForm = qs("#project-form");
  if (projectForm) {
    const fileInput = qs("#project-image", projectForm);
    const preview = qs("#image-preview");
    fileInput && fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (!/image\/(jpeg|jpg|png|webp)/.test(file.type)) { toast("Please choose a JPG, PNG or WEBP image.", false); fileInput.value = ""; return; }
      if (file.size > 5 * 1024 * 1024) { toast("Image must be under 5MB.", false); fileInput.value = ""; return; }
      const reader = new FileReader();
      reader.onload = () => { preview.src = reader.result; preview.style.display = "block"; };
      reader.readAsDataURL(file);
    });

    projectForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = projectForm.querySelector("button[type=submit]");
      const editId = projectForm.dataset.editId;
      btn.disabled = true; btn.textContent = "Publishing...";
      try {
        let imageBase64 = null;
        const file = fileInput.files[0];
        if (file) imageBase64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        const payload = {
          token: adminToken(),
          project_id: editId || undefined,
          title: projectForm.title.value.trim(),
          story: projectForm.story.value.trim(),
          image: imageBase64,
        };
        const res = await callGAS(editId ? "updateProject" : "addProject", payload, "POST");
        if (res && res.success) {
          toast(editId ? "Project updated." : "Project published successfully.", true);
          projectForm.reset();
          delete projectForm.dataset.editId;
          preview.style.display = "none";
          qs("#project-form-heading").textContent = "Add Project";
          loadDashboardData();
          qs('[data-tab="projects"]').click();
        } else {
          toast((res && res.message) || "Unable to publish project.", false);
        }
      } catch (err) {
        toast(err.message === "GAS_NOT_CONFIGURED"
          ? "Connect Google Apps Script (see README) to publish projects."
          : "Unable to upload the image. Please try again.", false);
      } finally {
        btn.disabled = false; btn.textContent = "Publish Project";
      }
    });
  }
}

/* -------------------------------------------------------------------- */
/*  Init                                                                 */
/* -------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileNav();
  initReveal();
  initCounters();
  initHeroParticles();
  initContactLinks();
  initContactForm();
  initProjects();
  initAdmin();
});
