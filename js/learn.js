(() => {
  "use strict";
  // Map / Learn tabs, and the "Learn the Game" view: an SVG pitch that stays pinned at the top
  // while the lesson text scrolls beneath it. All wording lives in data/learn/<lang>.json so it can
  // be translated without touching this file. Nothing here needs the map library or the internet
  // (once the app has been opened online once, the service worker keeps these files for offline use).
  const LANG = "en";
  const DATA_URL = "./data/learn/" + LANG + ".json";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById(id);

  const tabs = [...document.querySelectorAll(".tab")];
  const mapView = $("map-view");
  const learnView = $("learn-view");
  const pitch = $("pitch");
  const dock = $("pitch-dock");
  const lessonsEl = $("lessons");
  const roleKey = $("role-key");

  // ---------- Tabs ----------
  let learnScroll = 0;
  function showView(view, updateHash) {
    const learn = view === "learn";
    if (learn === !learnView.hidden) return;
    if (!learn) learnScroll = learnView.scrollTop;
    learnView.hidden = !learn;
    mapView.inert = learn; // keeps the hidden map out of reach of touch and screen readers
    document.body.dataset.view = view;
    for (const tab of tabs) {
      if (tab.dataset.view === view) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    }
    if (learn) { learnView.scrollTop = learnScroll; updateFocus(true); }
    if (updateHash && window.history && history.replaceState) {
      try { history.replaceState(null, "", learn ? "#learn" : location.pathname + location.search); } catch (e) { /* ignore */ }
    }
  }
  for (const tab of tabs) tab.addEventListener("click", () => showView(tab.dataset.view, true));
  window.addEventListener("hashchange", () => showView(location.hash === "#learn" ? "learn" : "map", false));

  // ---------- Players (11 per team in a 4-4-2, plus the referee) ----------
  // Coordinates are metres on a 105 x 68 pitch. Red kicks off, so the blue forwards stay outside the centre circle.
  const ys = [9, 23, 45, 59]; // a back four / midfield four: full-backs wide, centre-backs clear of the penalty arc
  const players = [];
  const add = (team, role, x, y) => players.push({ team, role, x, y });
  add("red", "gk", 3.5, 34); ys.forEach((y) => add("red", "def", 18, y)); ys.forEach((y) => add("red", "mid", 30, y)); [30, 38].forEach((y) => add("red", "fwd", 47.5, y));
  add("blue", "gk", 101.5, 34); ys.forEach((y) => add("blue", "def", 87, y)); ys.forEach((y) => add("blue", "mid", 75, y)); [28, 40].forEach((y) => add("blue", "fwd", 66, y));
  add("official", "ref", 41, 50);

  const playerLabels = [];
  const playersLayer = $("players");
  for (const p of players) {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "player");
    g.setAttribute("data-team", p.team);
    g.setAttribute("data-role", p.role);
    g.setAttribute("transform", "translate(" + p.x + " " + p.y + ")");
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", p.role === "ref" ? "2.7" : "3.2");
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("dy", p.role === "gk" ? ".95" : "1.1");
    g.append(circle, label);
    playersLayer.append(g);
    playerLabels.push({ role: p.role, label });
  }

  // ---------- Which part of the pitch is highlighted ----------
  let lessonEls = [];
  let sectionFocus = "all";
  let currentLesson = null;
  let manualRole = null;
  const chips = new Map();

  function applyFocus() {
    pitch.setAttribute("data-focus", manualRole || sectionFocus);
    for (const [role, chip] of chips) chip.setAttribute("aria-pressed", String(manualRole === role));
  }
  const landscape = window.matchMedia("(orientation: landscape) and (max-height: 520px)");
  function updateFocus(force) {
    if (!lessonEls.length || learnView.hidden) return;
    // The reading line sits just under the pinned pitch (or near the top when the pitch is beside the text).
    const line = landscape.matches ? learnView.getBoundingClientRect().top + 70 : dock.getBoundingClientRect().bottom + 24;
    let active = null;
    for (const el of lessonEls) { if (el.getBoundingClientRect().top <= line) active = el; else break; }
    if (active === currentLesson && !force) return;
    if (active !== currentLesson) manualRole = null; // moving on to another lesson clears a tapped position
    currentLesson = active;
    sectionFocus = active ? active.dataset.focus : "all";
    applyFocus();
  }
  let ticking = false;
  const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; updateFocus(false); }); };
  learnView.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // ---------- Text from the language file ----------
  const el = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };
  const lookup = (obj, path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);

  function render(data) {
    for (const node of document.querySelectorAll("[data-text]")) {
      const value = lookup(data, node.dataset.text);
      if (typeof value === "string") node.textContent = value;
    }
    $("pitch-title").textContent = data.ui.pitchLabel;
    roleKey.setAttribute("aria-label", data.ui.keyLabel);
    for (const { role, label } of playerLabels) label.textContent = data.roles[role].short;

    roleKey.replaceChildren();
    for (const role of ["gk", "def", "mid", "fwd"]) {
      const chip = el("button", null, "chip");
      chip.type = "button";
      chip.append(el("b", data.roles[role].short), document.createTextNode(data.roles[role].name));
      chip.addEventListener("click", () => { manualRole = manualRole === role ? null : role; applyFocus(); });
      chips.set(role, chip);
      roleKey.append(chip);
    }

    lessonsEl.replaceChildren();
    for (const lesson of data.lessons) {
      const section = el("section", null, "lesson");
      section.id = "lesson-" + lesson.id;
      section.dataset.focus = lesson.focus || "all";
      section.append(el("h3", lesson.title));
      for (const text of lesson.paragraphs || []) section.append(el("p", text));
      if (lesson.items && lesson.items.length) {
        const list = el("ul");
        for (const item of lesson.items) { const li = el("li"); li.append(el("strong", item.term), document.createTextNode(" — " + item.text)); list.append(li); }
        section.append(list);
      }
      lessonsEl.append(section);
    }
    lessonEls = [...lessonsEl.children];

    const foot = $("learn-foot");
    foot.replaceChildren();
    const source = el("p");
    const at = data.footer.source.indexOf(data.footer.sourceLinkText);
    if (at >= 0) {
      const link = el("a", data.footer.sourceLinkText);
      link.href = data.footer.sourceLink; link.target = "_blank"; link.rel = "noopener noreferrer";
      source.append(document.createTextNode(data.footer.source.slice(0, at)), link, document.createTextNode(data.footer.source.slice(at + data.footer.sourceLinkText.length)));
    } else source.textContent = data.footer.source;
    foot.append(source, el("p", data.footer.independence), el("p", data.ui.illustration));
    updateFocus(true);
  }

  fetch(DATA_URL).then((response) => { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); })
    .then(render)
    .catch(() => { lessonsEl.replaceChildren(el("p", "The lessons could not load. Check your connection and reload.", "learn-error")); });

  showView(location.hash === "#learn" ? "learn" : "map", false);
})();
