(function () {
  const TABS = ["today", "transport", "restaurants", "summary"];

  const els = {
    main: document.getElementById("app-main"),
    dayTitle: document.getElementById("day-title"),
    prevBtn: document.getElementById("prev-day"),
    nextBtn: document.getElementById("next-day"),
    tabBar: document.getElementById("tab-bar"),
    menuBtn: document.getElementById("menu-btn"),
    menuPanel: document.getElementById("menu-panel"),
  };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function todayDateString(now) {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function getDayIndexForDate(days, dateStr) {
    return days.findIndex((d) => d.date === dateStr);
  }

  function resolveInitialDayIndex(days, now) {
    const idx = getDayIndexForDate(days, todayDateString(now));
    return idx === -1 ? 0 : idx;
  }

  function parseHash(hash) {
    const clean = hash.replace(/^#\/?/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts[0] === "day" && parts[1]) {
      return { view: "day", date: parts[1], tab: TABS.includes(parts[2]) ? parts[2] : "today" };
    }
    if (parts[0] === "menu" && parts[1]) {
      return { view: "menu", section: parts[1] };
    }
    return null;
  }

  function buildDayHash(date, tab) {
    return `#/day/${date}/${tab}`;
  }

  function buildMenuHash(section) {
    return `#/menu/${section}`;
  }

  function el(tag, options = {}, children = []) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.attrs) {
      Object.keys(options.attrs).forEach((key) => node.setAttribute(key, options.attrs[key]));
    }
    children.forEach((child) => {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function textEl(tag, text, className) {
    return el(tag, { text, className });
  }

  function renderTimelineNodes(items) {
    if (!items || items.length === 0) return [];
    return items.map((item) => {
      const children = [textEl("span", item.time, "time"), textEl("span", item.activity, "activity")];
      if (item.note) children.push(textEl("div", item.note, "note"));
      return el("div", { className: "timeline-item" }, children);
    });
  }

  function renderAlternativesNodes(alternatives) {
    return alternatives.map((alt) => {
      const className = "alt-plan" + (alt.recommended ? " recommended" : "");
      const heading = textEl("h4", alt.label + (alt.recommended ? "（推薦）" : ""));
      const children = [heading, ...renderTimelineNodes(alt.timeline)];
      if (alt.note) children.push(textEl("div", alt.note, "note"));
      return el("div", { className }, children);
    });
  }

  function renderInfoBlockNodes(items, primaryKey, secondaryKey, noteKey) {
    if (!items || items.length === 0) {
      return [textEl("p", "本日無特別資訊", "note")];
    }
    return items.map((item) => {
      const heading = el("h3");
      heading.appendChild(document.createTextNode(item[primaryKey]));
      if (secondaryKey && item[secondaryKey]) {
        heading.appendChild(document.createTextNode("　"));
        heading.appendChild(textEl("span", item[secondaryKey], "note"));
      }
      const blockChildren = [heading];
      if (item[noteKey]) blockChildren.push(textEl("div", item[noteKey], "note"));
      return el("div", { className: "info-block" }, blockChildren);
    });
  }

  function renderTransportNodes(items) {
    return renderInfoBlockNodes(items, "label", null, "detail");
  }

  function renderRestaurantNodes(items) {
    return renderInfoBlockNodes(items, "name", "time", "note");
  }

  function renderTipsNode(tips) {
    if (!tips || tips.length === 0) return null;
    return el("ul", { className: "tip-list" }, tips.map((t) => textEl("li", t)));
  }

  function renderSummaryNodes(day) {
    const nodes = [textEl("div", day.title, "day-title-main"), textEl("h3", "今日行程")];
    if (day.alternatives.length) {
      nodes.push(...renderAlternativesNodes(day.alternatives));
    } else {
      nodes.push(...renderTimelineNodes(day.timeline));
    }
    nodes.push(textEl("h3", "交通"), ...renderTransportNodes(day.transport));
    nodes.push(textEl("h3", "餐廳"), ...renderRestaurantNodes(day.restaurants));
    const tipsNode = renderTipsNode(day.tips);
    if (tipsNode) nodes.push(tipsNode);
    return nodes;
  }

  function renderDayView(dayIndex, tab) {
    const day = TRIP.days[dayIndex];
    els.dayTitle.textContent = `${day.date.slice(5).replace("-", "/")}（${day.weekday}）`;
    els.prevBtn.disabled = dayIndex === 0;
    els.nextBtn.disabled = dayIndex === TRIP.days.length - 1;

    let nodes = [];
    if (tab === "today") {
      nodes.push(textEl("div", day.title, "day-title-main"));
      if (day.alternatives.length) {
        nodes.push(...renderAlternativesNodes(day.alternatives));
      } else {
        nodes.push(...renderTimelineNodes(day.timeline));
      }
      const tipsNode = renderTipsNode(day.tips);
      if (tipsNode) nodes.push(tipsNode);
    } else if (tab === "transport") {
      nodes.push(textEl("div", `${day.title}｜交通`, "day-title-main"), ...renderTransportNodes(day.transport));
    } else if (tab === "restaurants") {
      nodes.push(textEl("div", `${day.title}｜餐廳`, "day-title-main"), ...renderRestaurantNodes(day.restaurants));
    } else if (tab === "summary") {
      nodes = renderSummaryNodes(day);
    }
    els.main.replaceChildren(...nodes);

    Array.from(els.tabBar.children).forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    els.menuPanel.classList.add("hidden");
  }

  function renderOverviewTableNode(rows) {
    const thead = el("thead", {}, [
      el("tr", {}, [textEl("th", "日期"), textEl("th", "行程主軸"), textEl("th", "住宿")]),
    ]);
    const tbody = el(
      "tbody",
      {},
      rows.map((r) => el("tr", {}, [textEl("td", r.date), textEl("td", r.plan), textEl("td", r.hotel)]))
    );
    return el("table", { className: "overview-table" }, [thead, tbody]);
  }

  function renderTodoListNode(items) {
    return el(
      "ul",
      { className: "todo-list" },
      items.map((t) => textEl("li", `${t.done ? "✅" : "⬜️"} ${t.item}`))
    );
  }

  function renderSouvenirListNode(items) {
    return el(
      "ul",
      { className: "souvenir-list" },
      items.map((s) => {
        const li = el("li");
        li.appendChild(textEl("strong", `${s.category}：`));
        li.appendChild(document.createTextNode(s.items));
        return li;
      })
    );
  }

  function renderMenuContentNodes(section) {
    if (section === "overview") return [textEl("h2", "行程總表"), renderOverviewTableNode(TRIP.overview)];
    if (section === "todo") return [textEl("h2", "TODO 清單"), renderTodoListNode(TRIP.todo)];
    if (section === "souvenirs") return [textEl("h2", "伴手禮建議"), renderSouvenirListNode(TRIP.souvenirs)];
    return [];
  }

  function openMenu(section) {
    const closeBtn = el("button", { attrs: { id: "menu-close", "aria-label": "關閉選單" }, text: "×" });
    const nav = el("nav", { attrs: { id: "menu-nav" } }, [
      el("button", { className: "menu-link", attrs: { "data-section": "overview" }, text: "行程總表" }),
      el("button", { className: "menu-link", attrs: { "data-section": "todo" }, text: "TODO 清單" }),
      el("button", { className: "menu-link", attrs: { "data-section": "souvenirs" }, text: "伴手禮建議" }),
    ]);
    const content = el("div", { attrs: { id: "menu-content" } }, renderMenuContentNodes(section));

    els.menuPanel.replaceChildren(closeBtn, nav, content);
    els.menuPanel.classList.remove("hidden");

    closeBtn.addEventListener("click", () => {
      location.hash = buildDayHash(TRIP.days[state.dayIndex].date, state.tab);
    });
    nav.querySelectorAll(".menu-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        location.hash = buildMenuHash(btn.dataset.section);
      });
    });
  }

  const state = { dayIndex: resolveInitialDayIndex(TRIP.days, new Date()), tab: "today" };

  function render() {
    const parsed = parseHash(location.hash);
    if (parsed && parsed.view === "menu") {
      openMenu(parsed.section);
      return;
    }
    if (parsed && parsed.view === "day") {
      const idx = getDayIndexForDate(TRIP.days, parsed.date);
      state.dayIndex = idx === -1 ? state.dayIndex : idx;
      state.tab = parsed.tab;
    }
    renderDayView(state.dayIndex, state.tab);
  }

  els.prevBtn.addEventListener("click", () => {
    if (state.dayIndex > 0) {
      state.dayIndex -= 1;
      location.hash = buildDayHash(TRIP.days[state.dayIndex].date, state.tab);
    }
  });

  els.nextBtn.addEventListener("click", () => {
    if (state.dayIndex < TRIP.days.length - 1) {
      state.dayIndex += 1;
      location.hash = buildDayHash(TRIP.days[state.dayIndex].date, state.tab);
    }
  });

  els.tabBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    state.tab = btn.dataset.tab;
    location.hash = buildDayHash(TRIP.days[state.dayIndex].date, state.tab);
  });

  els.menuBtn.addEventListener("click", () => {
    location.hash = buildMenuHash("overview");
  });

  window.addEventListener("hashchange", render);

  if (!location.hash) {
    location.hash = buildDayHash(TRIP.days[state.dayIndex].date, state.tab);
  } else {
    render();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    });
  }

  window.__TRIP_APP__ = { parseHash, buildDayHash, buildMenuHash, resolveInitialDayIndex, getDayIndexForDate };
})();
