const API_URL = "https://mental-health-score-60ej.onrender.com/predict";

const form = document.querySelector("#prediction-form");
const submitButton = form.querySelector('button[type="submit"]');
const feedback = document.querySelector("#feedback");
const result = document.querySelector("#result");
const scoreValue = document.querySelector("#score-value");
const scoreMeter = document.querySelector("#score-meter");
const scoreNote = document.querySelector("#score-note");

function displayError(message) {
  feedback.textContent = message;
  feedback.hidden = false;
}

function clearError() {
  feedback.textContent = "";
  feedback.hidden = true;
}

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
    const bubbleSize = 46 + (normalizedScore / 10) * 92;
    scoreMeter.style.setProperty("--bubble-size", `${bubbleSize}px`);
    scoreNote.textContent = "Model-generated estimate. This is not a diagnosis or clinical assessment.";
    scoreMeter.setAttribute("aria-label", `Predicted score: ${score.toFixed(2)} out of 10`);
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    displayError(
      error instanceof TypeError
        ? "Could not connect to the prediction service. Check that the API is running on port 2000 and try again."
        : error.message,
    );
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Get my estimate";
  }
});