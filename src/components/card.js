// Renders a question card from data
export function renderCard(question, usersById) {
  const imagePool = [
    "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg",
    "https://images.pexels.com/photos/4144096/pexels-photo-4144096.jpeg",
    "https://images.pexels.com/photos/4144222/pexels-photo-4144222.jpeg",
    "https://images.pexels.com/photos/5905703/pexels-photo-5905703.jpeg",
    "https://images.pexels.com/photos/4144144/pexels-photo-4144144.jpeg",
  ];

  // pick a stable pseudo-random image based on question id so it doesn't change every render
  const idx = Math.abs(String(question.id || "0").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % imagePool.length;
  const imgUrl = imagePool[idx];
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

  const topicLabel = question.topic || "General";
  const topicBadge = `<div class="badge badge--soft">${escapeHtml(
    topicLabel
  )}</div>`;

  let confidenceText = "";
  if (question.confidence === "high") confidenceText = "High confidence";
  else if (question.confidence === "low") confidenceText = "Low confidence";
  else if (question.confidence === "medium") confidenceText = "Medium confidence";

  const confidenceSuffix = confidenceText ? ` · ${confidenceText}` : "";

  // naive time text
  const posted = timeAgo(new Date(question.postedAt));

  return `
  <article class="card" tabindex="0" data-id="${question.id}">
    <div class="card__media" style="background-image:url('${imgUrl}'); background-size:cover; background-position:center;"></div>
    <div class="card__body">
      ${badge}
      ${topicBadge}
      ${
        question.needsReview
          ? '<div class="badge" style="background:#ffe0e0;border-color:#ffb3b3;color:#b00">Needs Review</div>'
          : ""
      }
      <h2 class="card__title">${escapeHtml(question.title)}</h2>
      <div class="card__meta">
        <span>Posted ${posted}${confidenceSuffix}</span>
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
