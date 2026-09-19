// ===== Mock Data =====
const PLACES = [
  { id: "p1", name: "평거린양꼬치 신사점", cat: "일식 · 신사", emoji: "🍜", address: "서울 강남구 신사동 123-45", phone: "02) 0000-0000" },
  { id: "p2", name: "신사역 스시냥냥", cat: "일식 · 신사", emoji: "🍣", address: "서울 강남구 신사동 55-1", phone: "02) 111-2222" },
  { id: "p3", name: "또래오래 신사역점", cat: "치킨 · 신사", emoji: "🍗", address: "서울 강남구 신사동 77-9", phone: "02) 333-4444" },
  { id: "p4", name: "을지로 옛날통닭", cat: "한식 · 을지로", emoji: "🍗", address: "서울 중구 을지로 12-3", phone: "02) 555-6666" },
  { id: "p5", name: "홍대 카페 모카", cat: "카페 · 홍대", emoji: "☕", address: "서울 마포구 홍대입구 3-2", phone: "02) 777-8888" },
];

const GROUPS = [
  { id: "g1", name: "까치산 맛집", desc: "동네 단골 리스트", memberCount: 8, placeCount: 18, shared: true, placeIds: ["p1", "p2"] },
  { id: "g2", name: "데이트 코스", desc: "홍대, 종로 일대 맛집 모음", memberCount: 3, placeCount: 3, shared: true, placeIds: ["p1", "p2", "p3"] },
  { id: "g3", name: "신사역 맛집", desc: "회사 근처 점심용", memberCount: 1, placeCount: 5, shared: false, placeIds: ["p3"] },
];

const MEMBERS = [
  { id: "m1", name: "백주희", role: "OWNER" },
  { id: "m2", name: "아귀", role: "MEMBER" },
  { id: "m3", name: "양탱", role: "MEMBER" },
];

const RECENT_SEARCHES_INIT = ["을지로 맛집", "홍대 카페", "신사역 피자스쿨"];

// ===== State =====
const state = {
  currentGroupId: "g2",
  currentPlaceId: "p1",
  savedPlaceGroups: { p1: ["g2"], p2: ["g1", "g2"], p3: ["g2"] }, // placeId -> [groupId]
  recentSearches: [...RECENT_SEARCHES_INIT],
  navHistory: [],
  savingPlaceId: null,
  pendingSelection: null,
};

// ===== Navigation =====
function showScreen(id, pushHistory = true) {
  const current = document.querySelector(".screen.active");
  if (pushHistory && current && current.id !== id) {
    state.navHistory.push(current.id);
  }
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(id);
  target.classList.add("active");
  onScreenShow(id);
}

function goBack() {
  const prev = state.navHistory.pop();
  if (prev) showScreen(prev, false);
  else showScreen("screen-home", false);
}

function onScreenShow(id) {
  if (id === "screen-home") renderHome();
  if (id === "screen-search") renderSearch();
  if (id === "screen-place-detail") renderPlaceDetail();
  if (id === "screen-group-home") renderGroupHome();
  if (id === "screen-group-detail") renderGroupDetail();
  if (id === "screen-group-invite") renderInvite();
  if (id === "screen-group-member") renderMemberList();
  if (id === "screen-nearby-list") renderNearbyList();
}

// ===== Toast =====
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 1800);
}

// ===== Render: Home =====
function renderHome() {
  const groupsEl = document.getElementById("home-groups");
  groupsEl.innerHTML = GROUPS.slice(0, 5).map(groupMiniCard).join("");
  groupsEl.querySelectorAll("[data-group-id]").forEach((el) => {
    el.addEventListener("click", () => {
      state.currentGroupId = el.dataset.groupId;
      showScreen("screen-group-detail");
    });
  });

  const placesEl = document.getElementById("home-places");
  placesEl.innerHTML = PLACES.slice(0, 3).map((p) => placeRow(p, { showTags: true })).join("");
  bindPlaceRowEvents(placesEl);

  const friendsEl = document.getElementById("home-friends");
  friendsEl.innerHTML = MEMBERS.map(
    (m) => `<div class="friend-mini"><div class="fa">🙂</div><div class="fn">${m.name}</div></div>`
  ).join("");
}

function groupMiniCard(g) {
  return `
    <div class="group-card-mini" data-group-id="${g.id}">
      <div class="cover-mini">🖼️</div>
      <p class="name">${g.name}</p>
      <p class="meta">멤버 ${g.memberCount} · 맛집 ${g.placeCount}</p>
      ${g.shared ? '<span class="shared-tag">공유</span>' : ""}
    </div>`;
}

function placeRow(p, opts = {}) {
  const isSaved = isPlaceSaved(p.id);
  const groupTags = (state.savedPlaceGroups[p.id] || [])
    .map((gid) => GROUPS.find((g) => g.id === gid)?.name)
    .filter(Boolean);
  return `
    <div class="place-row" data-place-id="${p.id}">
      <div class="place-thumb">${p.emoji}</div>
      <div class="place-info">
        <p class="name">${p.name}</p>
        <p class="meta">${p.cat}</p>
        ${opts.showTags ? groupTags.map((t) => `<span class="place-tag">${t}</span>`).join("") : ""}
      </div>
      <button class="save-toggle ${isSaved ? "saved" : ""}" data-save-place="${p.id}">${isSaved ? "저장됨" : "저장"}</button>
    </div>`;
}

function bindPlaceRowEvents(container) {
  container.querySelectorAll("[data-place-id]").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("[data-save-place]")) return;
      state.currentPlaceId = row.dataset.placeId;
      showScreen("screen-place-detail");
    });
  });
  container.querySelectorAll("[data-save-place]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openGroupSelectSheet(btn.dataset.savePlace);
    });
  });
}

function isPlaceSaved(placeId) {
  return (state.savedPlaceGroups[placeId] || []).length > 0;
}

// ===== Render: Search =====
function renderSearch() {
  document.getElementById("search-input").value = "";
  document.getElementById("search-recent").classList.remove("hidden");
  document.getElementById("search-results").classList.add("hidden");
  document.getElementById("search-empty").classList.add("hidden");
  renderRecentList();
  setTimeout(() => document.getElementById("search-input").focus(), 50);
}

function renderRecentList() {
  const el = document.getElementById("recent-list");
  el.innerHTML = state.recentSearches
    .map((q) => `<span class="chip recent" data-query="${q}">${q} <span class="x" data-remove="${q}">✕</span></span>`)
    .join("");
  el.querySelectorAll("[data-query]").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      if (e.target.closest("[data-remove]")) return;
      runSearch(chip.dataset.query);
    });
  });
  el.querySelectorAll("[data-remove]").forEach((x) => {
    x.addEventListener("click", (e) => {
      e.stopPropagation();
      state.recentSearches = state.recentSearches.filter((q) => q !== x.dataset.remove);
      renderRecentList();
    });
  });
}

function runSearch(query) {
  const q = query.trim();
  document.getElementById("search-input").value = q;
  if (!q) return;
  if (!state.recentSearches.includes(q)) {
    state.recentSearches.unshift(q);
    state.recentSearches = state.recentSearches.slice(0, 10);
  }
  const results = PLACES.filter((p) => p.name.includes(q) || p.cat.includes(q));
  document.getElementById("search-recent").classList.add("hidden");
  if (results.length === 0) {
    document.getElementById("search-results").classList.add("hidden");
    document.getElementById("search-empty").classList.remove("hidden");
    return;
  }
  document.getElementById("search-empty").classList.add("hidden");
  document.getElementById("search-results").classList.remove("hidden");
  document.getElementById("result-count").textContent = `총 ${results.length}개`;
  const listEl = document.getElementById("result-list");
  listEl.innerHTML = results.map((p) => placeRow(p)).join("");
  bindPlaceRowEvents(listEl);
}

// ===== Render: Place Detail =====
function renderPlaceDetail() {
  const p = PLACES.find((pl) => pl.id === state.currentPlaceId) || PLACES[0];
  document.getElementById("pd-image").textContent = p.emoji;
  document.getElementById("pd-name").textContent = p.name;
  document.getElementById("pd-cat").textContent = p.cat;
  document.getElementById("pd-address").textContent = p.address;
  document.getElementById("pd-phone").textContent = p.phone;
  const saveBtn = document.getElementById("pd-save-btn");
  const saved = isPlaceSaved(p.id);
  saveBtn.textContent = saved ? "저장됨" : "저장";
  saveBtn.classList.toggle("saved", saved);
  document.getElementById("pd-hours-detail").classList.add("hidden");
}

// ===== Render: Group Home =====
function renderGroupHome() {
  document.getElementById("group-count").textContent = `총 ${GROUPS.length}개`;
  const el = document.getElementById("group-home-list");
  el.innerHTML = GROUPS.map(
    (g) => `
    <div class="group-card" data-group-id="${g.id}">
      <div class="group-card-cover">🖼️</div>
      <div class="group-card-info">
        <p class="group-card-name">${g.name}</p>
        <p class="group-card-meta">멤버 ${g.memberCount} · 맛집 ${g.placeCount}${g.shared ? " · 공유" : ""}</p>
      </div>
    </div>`
  ).join("");
  el.querySelectorAll("[data-group-id]").forEach((card) => {
    card.addEventListener("click", () => {
      state.currentGroupId = card.dataset.groupId;
      showScreen("screen-group-detail");
    });
  });
}

// ===== Render: Group Detail =====
function renderGroupDetail() {
  const g = GROUPS.find((gr) => gr.id === state.currentGroupId) || GROUPS[0];
  document.getElementById("gd-name").textContent = g.name;
  document.getElementById("gd-desc").textContent = g.desc;
  document.getElementById("gd-place-count").textContent = g.placeIds.length;
  document.getElementById("gd-member-count").textContent = g.memberCount;

  const placesEl = document.getElementById("gd-panel-places");
  const groupPlaces = PLACES.filter((p) => g.placeIds.includes(p.id));
  placesEl.innerHTML =
    groupPlaces.length > 0
      ? groupPlaces.map((p) => placeRow(p)).join("")
      : `<div class="empty-state"><div class="moo-char">🐮</div><p class="empty-title">아직 저장된 맛집이 없어요</p></div>`;
  bindPlaceRowEvents(placesEl);

  const membersEl = document.getElementById("gd-panel-members");
  membersEl.innerHTML = MEMBERS.slice(0, g.memberCount).map(memberRow).join("");
  bindMemberRemoveEvents(membersEl);

  document.querySelectorAll("[data-gd-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.gdTab === "places");
  });
  placesEl.classList.remove("hidden");
  membersEl.classList.add("hidden");
}

function memberRow(m) {
  return `
    <div class="member-row">
      <div class="avatar">🙂</div>
      <span class="member-name">${m.name}</span>
      ${m.role === "OWNER" ? '<span class="member-role">그룹장</span>' : `<button class="member-remove" data-member-id="${m.id}">내보내기</button>`}
    </div>`;
}

function bindMemberRemoveEvents(container) {
  container.querySelectorAll("[data-member-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      showConfirmDialog(
        "이 멤버를 그룹에서 내보낼까요?",
        "",
        () => showToast("멤버를 내보냈어요."),
        "내보내기"
      );
    });
  });
}

function renderMemberList() {
  const el = document.getElementById("member-list");
  el.innerHTML = MEMBERS.map(memberRow).join("");
  bindMemberRemoveEvents(el);
}

function renderInvite() {
  const g = GROUPS.find((gr) => gr.id === state.currentGroupId) || GROUPS[0];
  const el = document.getElementById("invite-members");
  el.innerHTML = MEMBERS.slice(0, g.memberCount)
    .map((m) => `<div class="friend-mini"><div class="fa">🙂</div><div class="fn">${m.name}</div></div>`)
    .join("");
}

// ===== Render: Nearby List =====
function renderNearbyList() {
  const el = document.getElementById("nearby-list");
  el.innerHTML = PLACES.map((p) => placeRow(p)).join("");
  bindPlaceRowEvents(el);
}

// ===== Group Select Bottom Sheet =====
function openGroupSelectSheet(placeId) {
  state.savingPlaceId = placeId;
  state.pendingSelection = new Set(state.savedPlaceGroups[placeId] || []);
  renderSheetGroupList();
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById("sheet-group-select").classList.remove("hidden");
}

function closeGroupSelectSheet() {
  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("sheet-group-select").classList.add("hidden");
}

function renderSheetGroupList() {
  const el = document.getElementById("sheet-group-list");
  if (GROUPS.length === 0) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = GROUPS.map((g) => {
    const checked = state.pendingSelection.has(g.id);
    return `
      <label class="sheet-row">
        <div class="cover-mini">🖼️</div>
        <div class="info">
          <p class="name">${g.name}</p>
          <p class="meta">멤버 ${g.memberCount} · 맛집 ${g.placeCount}</p>
        </div>
        <input type="checkbox" data-sheet-group="${g.id}" ${checked ? "checked" : ""} />
      </label>`;
  }).join("");
  el.querySelectorAll("[data-sheet-group]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const gid = cb.dataset.sheetGroup;
      if (cb.checked) state.pendingSelection.add(gid);
      else state.pendingSelection.delete(gid);
    });
  });
}

function confirmGroupSelection() {
  const placeId = state.savingPlaceId;
  if (!placeId) return closeGroupSelectSheet();
  const before = state.savedPlaceGroups[placeId] || [];
  const after = Array.from(state.pendingSelection);
  state.savedPlaceGroups[placeId] = after;
  closeGroupSelectSheet();

  if (after.length === 0 && before.length > 0) {
    showToast("저장을 해제했어요.");
  } else if (after.length > 0) {
    showToast("맛집을 저장했어요.");
  }
  // refresh visible screen
  const activeId = document.querySelector(".screen.active")?.id;
  if (activeId) onScreenShow(activeId);
}

// ===== Confirm Dialog =====
function showConfirmDialog(title, desc, onConfirm, confirmLabel = "삭제") {
  document.getElementById("dialog-title").textContent = title;
  document.getElementById("dialog-desc").textContent = desc;
  const dialog = document.getElementById("dialog-confirm");
  const confirmBtn = document.getElementById("dialog-confirm-btn");
  confirmBtn.textContent = confirmLabel;
  dialog.classList.remove("hidden");

  const cleanup = () => dialog.classList.add("hidden");
  const cancelBtn = document.getElementById("dialog-cancel");

  const handleConfirm = () => {
    cleanup();
    onConfirm();
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
  };
  const handleCancel = () => {
    cleanup();
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
  };
  confirmBtn.addEventListener("click", handleConfirm);
  cancelBtn.addEventListener("click", handleCancel);
}

// ===== Event Bindings =====
document.addEventListener("DOMContentLoaded", () => {
  // data-nav
  document.body.addEventListener("click", (e) => {
    const navEl = e.target.closest("[data-nav]");
    if (navEl) {
      showScreen(navEl.dataset.nav);
    }
    const backEl = e.target.closest("[data-back]");
    if (backEl) {
      goBack();
    }
  });

  // bottom nav tabs (no history push, reset stack)
  document.body.addEventListener("click", (e) => {
    const tabEl = e.target.closest("[data-tab]");
    if (tabEl) {
      state.navHistory = [];
      showScreen(tabEl.dataset.tab, false);
    }
  });

  // login buttons -> route to terms (simulate new user) first time, else home
  let hasLoggedInOnce = false;
  document.querySelectorAll("[data-action='login']").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!hasLoggedInOnce) {
        hasLoggedInOnce = true;
        showScreen("screen-terms");
      } else {
        showScreen("screen-home");
      }
    });
  });

  // terms checkboxes
  const termAll = document.getElementById("term-all");
  const termReqs = document.querySelectorAll(".term-req");
  const termConfirm = document.getElementById("terms-confirm");
  function updateTermsState() {
    const allRequiredChecked = Array.from(termReqs).every((r) => r.checked);
    termConfirm.disabled = !allRequiredChecked;
  }
  termAll.addEventListener("change", () => {
    document.querySelectorAll(".term-row input[type=checkbox]").forEach((cb) => {
      if (cb !== termAll) cb.checked = termAll.checked;
    });
    updateTermsState();
  });
  document.querySelectorAll(".term-row input[type=checkbox]").forEach((cb) => {
    if (cb !== termAll) cb.addEventListener("change", updateTermsState);
  });
  updateTermsState();

  // place detail hours accordion
  document.getElementById("pd-hours-toggle").addEventListener("click", () => {
    document.getElementById("pd-hours-detail").classList.toggle("hidden");
  });

  // place detail save button + bottom cta save
  document.getElementById("pd-save-btn").addEventListener("click", () => {
    openGroupSelectSheet(state.currentPlaceId);
  });
  document.querySelectorAll("[data-action='open-save-sheet']").forEach((btn) => {
    btn.addEventListener("click", () => {
      openGroupSelectSheet(state.currentPlaceId || "p4");
    });
  });

  // group select sheet
  document.getElementById("sheet-close").addEventListener("click", closeGroupSelectSheet);
  document.getElementById("overlay").addEventListener("click", closeGroupSelectSheet);
  document.getElementById("sheet-done").addEventListener("click", confirmGroupSelection);
  document.getElementById("sheet-new-group").addEventListener("click", () => {
    closeGroupSelectSheet();
  });

  // group create form validation
  const gcName = document.getElementById("gc-name");
  const gcDesc = document.getElementById("gc-desc");
  const gcSubmit = document.getElementById("gc-submit");
  function updateGcState() {
    document.getElementById("gc-name-count").textContent = gcName.value.length;
    document.getElementById("gc-desc-count").textContent = gcDesc.value.length;
    gcSubmit.disabled = gcName.value.trim().length === 0 || gcDesc.value.trim().length === 0;
  }
  gcName.addEventListener("input", updateGcState);
  gcDesc.addEventListener("input", updateGcState);
  gcSubmit.addEventListener("click", () => {
    if (gcSubmit.disabled) return;
    const newGroup = {
      id: "g" + (GROUPS.length + 1),
      name: gcName.value.trim(),
      desc: gcDesc.value.trim(),
      memberCount: 1,
      placeCount: 0,
      shared: false,
      placeIds: [],
    };
    GROUPS.unshift(newGroup);
    state.currentGroupId = newGroup.id;
    if (state.savingPlaceId) {
      state.pendingSelection.add(newGroup.id);
    }
    gcName.value = "";
    gcDesc.value = "";
    updateGcState();
    showToast("그룹을 만들었어요.");
    showScreen("screen-group-detail");
  });

  // group edit tab switching in group detail
  document.querySelectorAll("[data-gd-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-gd-tab]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.gdTab;
      document.getElementById("gd-panel-places").classList.toggle("hidden", tab !== "places");
      document.getElementById("gd-panel-members").classList.toggle("hidden", tab !== "members");
    });
  });

  // group edit delete
  document.getElementById("ge-delete").addEventListener("click", () => {
    showConfirmDialog(
      "그룹을 삭제할까요?",
      "그룹에 저장된 맛집과 공유 정보가 모두 삭제되며 복구할 수 없어요.",
      () => {
        const idx = GROUPS.findIndex((g) => g.id === state.currentGroupId);
        if (idx >= 0) GROUPS.splice(idx, 1);
        state.navHistory = [];
        showScreen("screen-group-home", false);
      },
      "삭제"
    );
  });

  // invite share
  document.getElementById("invite-share-btn").addEventListener("click", () => {
    showToast("공유 시트를 호출했어요.");
  });

  // search input events
  document.getElementById("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch(e.target.value);
  });
  document.getElementById("clear-recent").addEventListener("click", () => {
    state.recentSearches = [];
    renderRecentList();
  });

  // my logout
  document.getElementById("my-logout").addEventListener("click", () => {
    showConfirmDialog("로그아웃 하시겠어요?", "", () => {
      state.navHistory = [];
      showScreen("screen-login", false);
    }, "로그아웃");
  });

  // initial screen
  showScreen("screen-splash", false);
  setTimeout(() => showScreen("screen-login", false), 1400);
});
