const API_URL = "https://mental-health-score-60ej.onrender.com/predict";

const form = document.querySelector("#prediction-form");
const submitButton = form.querySelector('button[type="submit"]');
const feedback = document.querySelector("#feedback");
const scoreValue = document.querySelector("#score-value");
const scoreMeter = document.querySelector("#score-meter");
const scoreBubble = document.querySelector(".score-bubble");
const scoreNote = document.querySelector("#score-note");
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = themeToggle.querySelector(".theme-icon");
const themeLabel = themeToggle.querySelector(".theme-label");

function displayError(message) {
  feedback.textContent = message;
  feedback.hidden = false;
}

function clearError() {
  feedback.textContent = "";
  feedback.hidden = true;
}

function updateTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
  themeIcon.textContent = dark ? "☀" : "☾";
  themeLabel.textContent = dark ? "Light theme" : "Dark mode";
}

try {
  updateTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");
} catch {
  updateTheme("light");
}

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("theme", nextTheme);
  } catch {
    // The selected theme still applies for the current page when storage is unavailable.
  }
  updateTheme(nextTheme);
});

form.addEventListener("change", (event) => {
  if (event.target.matches('input[type="radio"]')) {
    const fieldset = event.target.closest("fieldset");
    fieldset.querySelectorAll(".choice").forEach((choice) => {
      choice.classList.toggle("selected", choice.querySelector("input").checked);
    });
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const payload = {
    Age: Number(formData.get("Age")),
    Gender: formData.get("Gender"),
    Country: formData.get("Country"),
    Academic_Level: formData.get("Academic_Level"),
    Most_Used_Platform: formData.get("Most_Used_Platform"),
    Purpose_Of_Use: formData.get("Purpose_Of_Use"),
    Avg_Daily_Usage_Hours: Number(formData.get("Avg_Daily_Usage_Hours")),
    Daily_Unlocks: Number(formData.get("Daily_Unlocks")),
    Study_Hours: Number(formData.get("Study_Hours")),
    Physical_Activity_Hours: Number(formData.get("Physical_Activity_Hours")),
    Sleep_Hours_Per_Night: Number(formData.get("Sleep_Hours_Per_Night")),
    Stress_Level: formData.get("Stress_Level"),
  };

  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Calculating your estimate…";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = responseBody?.detail;
      const message = Array.isArray(detail)
        ? detail.map((issue) => `${issue.loc?.slice(-1)[0] ?? "Input"}: ${issue.msg}`).join("; ")
        : typeof detail === "string"
          ? detail
          : "The prediction service could not process your answers.";
      throw new Error(message);
    }

    if (typeof responseBody?.predicted_mental_health_score !== "number") {
      throw new Error("The prediction service returned an unexpected response.");
    }

    const score = responseBody.predicted_mental_health_score;
    if (!Number.isFinite(score)) {
      throw new Error("The prediction service returned an invalid score.");
    }

    scoreValue.textContent = score.toFixed(2);
    const normalizedScore = Math.min(10, Math.max(0, score));
    const maxBubbleSize = Math.max(30, Math.min(scoreMeter.clientWidth, scoreMeter.clientHeight) - 24);
    const bubbleSize = Math.min(maxBubbleSize, 46 + (normalizedScore / 10) * 92);
    scoreBubble.style.width = `${bubbleSize}px`;
    scoreBubble.style.height = `${bubbleSize}px`;
    scoreBubble.style.setProperty("--bubble-size", `${bubbleSize}px`);
    scoreMeter.style.setProperty("--score-hue", `${normalizedScore * 12}`);
    scoreNote.textContent = "Model-generated estimate. This is not a diagnosis or clinical assessment.";
    scoreMeter.setAttribute("aria-label", `Predicted score: ${score.toFixed(2)} out of 10`);
  } catch (error) {
    displayError(
      error instanceof TypeError
        ? "Could not connect to the prediction service. Check that the API is running and try again."
        : error.message,
    );
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Get my estimate";
  }
});
