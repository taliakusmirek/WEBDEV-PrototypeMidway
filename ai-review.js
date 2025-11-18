document.addEventListener("DOMContentLoaded", () => {
  let draft = null;
  try {
    const raw = localStorage.getItem("qa_new_question");
    if (raw) draft = JSON.parse(raw);
  } catch {}

  const titleEl = document.getElementById("draft-title");
  const topicEl = document.getElementById("draft-topic");
  const confEl = document.getElementById("draft-confidence");
  const bodyEl = document.getElementById("draft-body");
  const suggestedTitleEl = document.getElementById("suggested-title");
  const suggestedBodyEl = document.getElementById("suggested-body");

  if (draft) {
    if (titleEl) titleEl.textContent = draft.title || "(Untitled question)";
    if (topicEl) topicEl.textContent = draft.topic || "General";
    if (confEl)
      confEl.textContent =
        draft.confidence === "high"
          ? "High confidence"
          : draft.confidence === "low"
          ? "Low confidence"
          : "Medium confidence";
    if (bodyEl) bodyEl.textContent = draft.body || "";

    if (suggestedTitleEl)
      suggestedTitleEl.textContent = draft.title || "Clarified question title";
    if (suggestedBodyEl)
      suggestedBodyEl.textContent =
        draft.body || "The AI would suggest a clearer explanation here.";
  }

  const editBtn = document.getElementById("btn-edit-question");
  const publishBtn = document.getElementById("btn-publish-question");

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      window.location.href = "questionform.html";
    });
  }

  if (publishBtn) {
    publishBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
});
