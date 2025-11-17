// Renders a question card from data
export function renderCard(question, usersById) {
  const responders = (question.responders || [])
    .slice(0, 3)
    .map((uid, i) => {
      const u = usersById[uid] || { avatarColor: "#d8d8d8" };
      return `<div class="avatar avatar--sm" style="background:${u.avatarColor}"></div>`;
    })
    .join("");

  const badge =
    question.badges && question.badges.length
      ? `<div class="badge">${question.badges[0]}</div>`
      : "";

  // naive time text
  const posted = timeAgo(new Date(question.postedAt));

  return `
  <article class="card" tabindex="0" data-id="${question.id}">
    <div class="card__media"></div>
    <div class="card__body">
      ${badge}
      ${
        question.needsReview
          ? '<div class="badge" style="background:#ffe0e0;border-color:#ffb3b3;color:#b00">Needs Review</div>'
          : ""
      }
      <h2 class="card__title">${escapeHtml(question.title)}</h2>
      <div class="card__meta">
        <span>Posted ${posted}</span>
        <div class="card__actions"><span class="icon-caret-up"></span><span class="icon-dots"></span></div>
      </div>
      <div class="card__footer">
        <div class="avatars">${responders}</div>
        <button class="pill" data-card-upvote="${
          question.id
        }" aria-label="Upvote question">+${question.upvotes ?? 0}</button>
      </div>
    </div>
  </article>`;
}

function timeAgo(date) {
  const diff = Math.max(0, Date.now() - date.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
