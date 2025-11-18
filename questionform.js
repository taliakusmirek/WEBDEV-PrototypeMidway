/* Note, this is referred to as "main.js" in questionform.html" */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("question-form");
  const nameField = document.getElementById("name");
  const questionField = document.getElementById("question");

  const confidenceButtons = document.querySelectorAll(".confidence-btn");
  const confidenceInput = document.getElementById("confidence");

  confidenceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      confidenceButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const value = btn.dataset.value;
      confidenceInput.value = value;
    });
  });

  const topicSelect = document.getElementById("topic");
  const newTopicContainer = document.querySelector(".new-topic-container");
  const newTopicInput = document.getElementById("new-topic");
  const saveTopicButton = document.getElementById("save-topic");

  topicSelect.addEventListener("change", () => {
    if (topicSelect.value === "add-new") {
      newTopicContainer.hidden = false;
      newTopicInput.focus();
    } else {
      newTopicContainer.hidden = true;
      newTopicInput.value = "";
    }
  });

  saveTopicButton.addEventListener("click", () => {
    const newTopic = newTopicInput.value.trim();
    if (!newTopic) return;

    const option = document.createElement("option");
    option.value = newTopic.toLowerCase().replace(/\s+/g, "-");
    option.textContent = newTopic;

    const addNewOption = topicSelect.querySelector('option[value="add-new"]');
    topicSelect.insertBefore(option, addNewOption);

    topicSelect.value = option.value;

    newTopicContainer.hidden = true;
    newTopicInput.value = "";
  });

  form.addEventListener("submit", (e) => {
    if (!form.checkValidity()) {
      return;
    }

    e.preventDefault();

    const name = nameField.value.trim() || "Anonymous";
    const topic =
      topicSelect.options[topicSelect.selectedIndex].textContent || "General";
    const confidence = confidenceInput.value || "medium";

    const questionText = questionField.value.trim();
    const derivedTitle =
      questionText.length > 60
        ? questionText.slice(0, 57).trimEnd() + "..."
        : questionText || "Question about " + topic;

    try {
      localStorage.setItem(
        "qa_new_question",
        JSON.stringify({
          name,
          topic,
          confidence,
          title: derivedTitle,
          body: questionText,
        })
      );
    } catch {}

    window.location.href = "ai-review.html";
  });
});
