console.log("MAIN.JS loaded");

import { loadStore, getStore, updateQuestion } from "./data/store.js";
import { renderCard } from "./components/card.js";
import { renderFilters } from "./components/filters.js";
import { openModal, closeModal } from "./components/modal.js";
import { renderThread } from "./components/thread.js";

window.addEventListener("DOMContentLoaded", async () => {
  window.__main_loaded = true;
  console.log("MAIN.JS DOMContentLoaded fired.");

  let store;
  try {
    store = await loadStore();
    console.log("[store loaded]", store);
  } catch (e) {
    console.error("Failed to load store", e);
    store = { questions: [], users: [] };
  }

  // Update course header from store
  const profEl = document.querySelector(".course__prof");
  const codeEl = document.querySelector(".course__code");
  if (profEl && store?.course?.professor)
    profEl.textContent = store.course.professor;
  if (codeEl && store?.course?.code) codeEl.textContent = store.course.code;

  // Render filters
  const filterRoot = document.getElementById("filter-root");
  let currentFilters = {};
  let searchTerm = "";
  let currentPage = 1;
  const pageSize = 4;
  let sortMode = "newest";

  // Restore state from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem("qa_state") || "{}");
    if (saved) {
      currentFilters = saved.filters || {};
      searchTerm = saved.search || "";
      currentPage = saved.page || 1;
      sortMode = saved.sort || "newest";
    }
  } catch {}
  if (filterRoot) {
    renderFilters(filterRoot, store);
    filterRoot.addEventListener("filters:apply", (e) => {
      currentFilters = e.detail || {};
      applyFilters(currentFilters, searchTerm);
    });
    filterRoot.addEventListener("filters:reset", () => {
      currentFilters = {};
      applyFilters(currentFilters, searchTerm);
    });
  }

  // Prepare lookup
  const usersById = Object.fromEntries(
    (store.users || []).map((u) => [u.id, u])
  );

  // Live search by title
  const searchInput = document.querySelector(".searchbar__input input");
  if (searchInput) {
    if (searchTerm) searchInput.value = searchTerm;
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value || "";
      applyFilters(currentFilters, searchTerm);
    });
    // Esc clears search
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        searchTerm = "";
        applyFilters(currentFilters, searchTerm);
      }
    });
  }

  // Sort selection
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.value = sortMode;
    sortSelect.addEventListener("change", () => {
      sortMode = sortSelect.value;
      applyFilters(currentFilters, searchTerm);
    });
  }

  // Navbar active switching
  document.querySelectorAll(".nav__links .nav__link").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .querySelectorAll(".nav__links .nav__link")
        .forEach((n) => n.classList.remove("is-active"));
      a.classList.add("is-active");
    });
  });

  // Simple Tags behavior: show only questions with a non-General topic
  const tagsLink = Array.from(
    document.querySelectorAll(".nav__links .nav__link")
  ).find((el) => el.textContent.trim() === "Tags");

  if (tagsLink) {
    tagsLink.addEventListener("click", (e) => {
      e.preventDefault();
      currentFilters = { ...currentFilters, topicNotGeneral: true };
      applyFilters(currentFilters, searchTerm);
    });
  }

  // Ask Question button: go to dedicated question form page
  const askBtn = document.getElementById("ask-btn");
  if (askBtn) {
    askBtn.addEventListener("click", () => {
      window.location.href = "questionform.html";
    });
  }

  // If there is a newly submitted question from the form, add it to the store
  try {
    const draftRaw = localStorage.getItem("qa_new_question");
    if (draftRaw) {
      const draft = JSON.parse(draftRaw);
      if (draft && draft.title && draft.body) {
        const s = getStore();
        const id = "q" + Math.random().toString(36).slice(2, 7);
        const now = new Date().toISOString();
        s.questions.unshift({
          id,
          title: draft.title,
          body: draft.body,
          topic: draft.topic || "General",
          postedAt: now,
          responders: [],
          upvotes: 0,
          badges: [],
          image: true,
          replies: [],
          confidence: draft.confidence || "medium",
        });
      }
      localStorage.removeItem("qa_new_question");
    }
  } catch {}

  // Render cards
  const cardsRoot = document.getElementById("cards-root");
  if (cardsRoot) {
    applyFilters(currentFilters, searchTerm);

    // Open modal on card click
    cardsRoot.addEventListener("click", (e) => {
      const up = e.target.closest("[data-card-upvote]");
      if (up) {
        const id = up.getAttribute("data-card-upvote");
        updateQuestion(id, (q) => ({ ...q, upvotes: (q.upvotes || 0) + 1 }));
        applyFilters(currentFilters, searchTerm);
        return;
      }
      const card = e.target.closest(".card");
      if (!card) return;
      const id = card.getAttribute("data-id");
      const q = (getStore().questions || []).find((x) => x.id === id);
      if (!q) return;
      openQuestionModal(q);
    });

    // Keyboard: open card on Enter/Space; Upvote on Enter/Space when pill focused
    cardsRoot.addEventListener("keydown", (e) => {
      const pill = e.target.closest("[data-card-upvote]");
      if (pill && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        const id = pill.getAttribute("data-card-upvote");
        updateQuestion(id, (q) => ({ ...q, upvotes: (q.upvotes || 0) + 1 }));
        applyFilters(currentFilters, searchTerm);
        return;
      }
      const card = e.target.closest(".card");
      if (card && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        const id = card.getAttribute("data-id");
        const q = (getStore().questions || []).find((x) => x.id === id);
        if (q) openQuestionModal(q);
      }
    });
  }

  function applyFilters(filters, term = "") {
    const s = getStore();
    let list = [...(s.questions || [])];
    if (filters.professor)
      list = list.filter((q) =>
        (q.badges || []).includes("Professor Response")
      );
    // In this simple demo, 'top' means upvotes > 1
    if (filters.top) list = list.filter((q) => (q.upvotes || 0) > 1);
    if (filters.ta) {
      // Demo heuristic: questions with at least 1 reply are considered 'TA Response'
      list = list.filter((q) => (q.replies || []).length > 0);
    }
    if (filters.topicNotGeneral) {
      list = list.filter(
        (q) => q.topic && String(q.topic).toLowerCase() !== "general"
      );
    }
    if (term) {
      const t = term.toLowerCase();
      list = list.filter((q) =>
        String(q.title || "")
          .toLowerCase()
          .includes(t)
      );
    }
    // Sorting
    if (sortMode === "newest") {
      list.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    } else if (sortMode === "oldest") {
      list.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt));
    } else if (sortMode === "top") {
      list.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    }
    // pagination
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const pageItems = list.slice(start, start + pageSize);
    const empty = document.getElementById("empty-state");
    if (pageItems.length) {
      if (empty) empty.style.display = "none";
      cardsRoot.innerHTML = pageItems
        .map((q) => renderCard(q, usersById))
        .join("");

      // Soft-animate cards in
      requestAnimationFrame(() => {
        cardsRoot.querySelectorAll(".card").forEach((card, i) => {
          setTimeout(() => card.classList.add("is-visible"), i * 30);
        });
      });
    } else {
      cardsRoot.innerHTML = "";
      if (empty) empty.style.display = "";
    }
    renderPagination(totalPages);
    // Persist state
    try {
      localStorage.setItem(
        "qa_state",
        JSON.stringify({
          filters,
          search: term,
          page: currentPage,
          sort: sortMode,
        })
      );
    } catch {}
  }

  function openQuestionModal(question) {
    const s = getStore();
    const users = Object.fromEntries((s.users || []).map((u) => [u.id, u]));
    const avatars = (question.responders || [])
      .slice(0, 3)
      .map((uid) => {
        const u = users[uid] || { avatarColor: "#d8d8d8" };
        return `<div class="avatar avatar--sm" style="background:${u.avatarColor}"></div>`;
      })
      .join("");

    const content = `
      <div class="modal">
        <div class="modal__header">
          <h3 class="modal__title">${escapeHtml(question.title)}</h3>
          ${
            question.needsReview
              ? '<div class="badge" style="background:#ffcccc;border-color:#ff9999;color:#a00">Needs Review</div>'
              : ""
          }
          <button class="modal__close" aria-label="Close">×</button>
        </div>
        <div class="modal__meta">Upvotes: <strong>${
          question.upvotes ?? 0
        }</strong></div>
        <div class="modal__body">${escapeHtml(question.body || "")}</div>
        <div class="modal__avatars">${avatars}</div>
        <div class="modal__actions">
          <button class="btn btn--small" data-action="upvote">Upvote</button>
          <button class="btn btn--small btn--ghost" data-action="needs-review">
            ${
              question.needsReview
                ? "Marked for Review"
                : "Mark as Needs Review"
            }
          </button>

        </div>
        <div class="modal__threads">
          ${renderThread(question.replies || [], users)}
        </div>
        <form class="modal__replyform">
          <textarea rows="3" placeholder="Add a reply..."></textarea>

          <label style="font-size:14px; font-weight:600;">
            Confidence (1-5):
            <select class="reply-confidence" style="margin-left:6px; padding:4px 6px; border-radius:6px; border:1px solid var(--border);">
              <option value="1">1 - Not confident</option>
              <option value="2">2</option>
              <option value="3" selected>3 - Somewhat confident</option>
              <option value="4">4</option>
              <option value="5">5 - Very confident</option>
            </select>
          </label>

          <div class="modal__replyactions">
            <button class="btn btn--small" type="submit">Post reply</button>
          </div>
        </form>

      </div>`;

    openModal(content);

    const root = document.getElementById("modal-root");
    root.querySelector(".modal__close").addEventListener("click", closeModal);
    root
      .querySelector('[data-action="upvote"]')
      .addEventListener("click", () => {
        updateQuestion(question.id, (q) => ({
          ...q,
          upvotes: (q.upvotes || 0) + 1,
        }));
        rerenderModal(question.id);
        renderCards();
      });
    root
      .querySelector('[data-action="needs-review"]')
      .addEventListener("click", () => {
        updateQuestion(question.id, (q) => ({
          ...q,
          needsReview: !q.needsReview,
        }));
        rerenderModal(question.id);
        renderCards?.();
      });
    root.querySelector(".modal__threads").addEventListener("click", (e) => {
      const replyBtn = e.target.closest("[data-reply]");
      const submitBtn = e.target.closest("[data-submit-reply]");
      const cancelBtn = e.target.closest("[data-cancel-reply]");
      const actionBtn = e.target.closest(
        "[data-edit], [data-delete], [data-upvote], [data-conf], [data-helpful], [data-me-too]"
      );

      // Open reply
      if (replyBtn) {
        const cid = replyBtn.dataset.reply;
        const box = root.querySelector(`[data-replybox="${cid}"]`);
        if (box) box.style.display = "block";
        return;
      }

      // Cancel reply
      if (cancelBtn) {
        const cid = cancelBtn.dataset.cancelReply;
        const box = root.querySelector(`[data-replybox="${cid}"]`);
        if (box) box.style.display = "none";
        return;
      }

      // Submit reply
      if (submitBtn) {
        const cid = submitBtn.dataset.submitReply;
        const box = root.querySelector(`[data-replybox="${cid}"]`);
        if (!box) return;

        const text = box.querySelector(".replybox__text").value.trim();
        const confidence = Number(
          box.querySelector(".replybox__confidence").value
        );

        if (!text) return;

        updateQuestion(question.id, (q) => {
          const clone = { ...q };
          addReplyToComment(clone.replies, cid, {
            id: "c" + Math.random().toString(36).slice(2, 7),
            author: "u1",
            body: text,
            upvotes: 0,
            replies: [],
            confidence,
          });
          return clone;
        });

        box.querySelector(".replybox__text").value = "";
        box.style.display = "none";

        rerenderModal(question.id);
        return;
      }

      // Misc
      if (actionBtn) {
        const action = actionBtn.dataset.edit
          ? "edit"
          : actionBtn.dataset.delete
          ? "delete"
          : actionBtn.dataset.upvote
          ? "up"
          : actionBtn.dataset.conf
          ? "conf"
          : actionBtn.dataset.helpful
          ? "helpful"
          : actionBtn.dataset.meToo
          ? "meToo"
          : null;

        const cid =
          actionBtn.dataset.edit ||
          actionBtn.dataset.delete ||
          actionBtn.dataset.upvote ||
          actionBtn.dataset.conf ||
          actionBtn.dataset.helpful ||
          actionBtn.dataset.meToo;

        updateQuestion(question.id, (q) => {
          const copy = q;
          mutateComment(copy.replies || [], cid, action);
          return { ...copy };
        });

        rerenderModal(question.id);
      }
    });
    root.querySelector(".modal__replyform").addEventListener("submit", (e) => {
      e.preventDefault();

      const ta = e.currentTarget.querySelector("textarea");
      const select = e.currentTarget.querySelector(".reply-confidence");

      const text = ta.value.trim();
      const confidence = Number(select.value);

      if (!text) return;
      if (!confidence || confidence < 1 || confidence > 5) {
        alert("Please choose a confidence level between 1 and 5.");
        return;
      }

      updateQuestion(question.id, (q) => ({
        ...q,
        replies: [
          ...(q.replies || []),
          {
            id: "c" + Math.random().toString(36).slice(2, 7),
            author: "u1",
            body: text,
            upvotes: 0,
            replies: [],
            confidence,
          },
        ],
      }));

      ta.value = "";
      select.value = "3"; // reset to default
      rerenderModal(question.id);
    });
  }

  function rerenderModal(qid) {
    const q = (getStore().questions || []).find((x) => x.id === qid);
    if (!q) return closeModal();
    const users = Object.fromEntries(
      (getStore().users || []).map((u) => [u.id, u])
    );
    const root = document.getElementById("modal-root");
    root.querySelector(".modal__meta").innerHTML = `Upvotes: <strong>${
      q.upvotes ?? 0
    }</strong>`;
    root.querySelector(".modal__threads").innerHTML = renderThread(
      q.replies || [],
      users
    );
  }

  function addReplyToComment(list, targetId, newReply) {
    for (let c of list) {
      if (c.id === targetId) {
        (c.replies ||= []).push(newReply);
        return true;
      }
      if (c.replies && addReplyToComment(c.replies, targetId, newReply))
        return true;
    }
    return false;
  }

  function mutateComment(list, targetId, action) {
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (c.id === targetId) {
        if (action === "up") c.upvotes = (c.upvotes || 0) + 1;
        else if (action === "delete") list.splice(i, 1);
        else if (action === "edit")
          c.body = prompt("Edit comment:", c.body || "") || c.body;
        else if (action === "reply")
          (c.replies ||= []).push({
            id: "c" + Math.random().toString(36).slice(2, 7),
            author: "u1",
            body: prompt("Reply:") || "",
            upvotes: 0,
            replies: [],
          });
        else if (action === "helpful")
          c.helpful = (c.helpful || 0) + 1;
        else if (action === "meToo")
          c.meToo = (c.meToo || 0) + 1;
        return true;
      }
      if (c.replies && mutateComment(c.replies, targetId, action)) return true;
    }
    return false;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function renderPagination(totalPages) {
    const pag = document.querySelector(".pagination__pages");
    if (!pag) return;

    pag.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.textContent = i;
      if (i === currentPage) li.classList.add("is-current");
      li.addEventListener("click", () => {
        currentPage = i;
        applyFilters(currentFilters, searchTerm);
      });
      pag.appendChild(li);
    }
  }
});
