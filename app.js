"use strict";

const modeChoices = document.querySelectorAll('input[name="summary-mode"]');
const modeHeading = document.getElementById("mode-heading");
const modeCopy = document.getElementById("mode-copy");

function updateSummaryMode(event) {
  const isManual = event.target.value === "manual";
  modeHeading.textContent = isManual
    ? "직접 고친 요약을 그대로 둡니다."
    : "정정한 답변을 반영합니다.";
  modeCopy.textContent = "두 답변 모두 문의 기록에 남습니다.";
}

for (const choice of modeChoices) {
  choice.addEventListener("change", updateSummaryMode);
}
const selectedMode = document.querySelector('input[name="summary-mode"]:checked');
if (selectedMode) updateSummaryMode({target: selectedMode});

const frameButtons = [...document.querySelectorAll(".frame-controls button")];
const frameImage = document.querySelector(".frame-image");
const frameNumber = document.getElementById("frame-number");

function selectFrame(index) {
  frameImage.style.backgroundPosition = (index * 25) + "% center";
  frameNumber.textContent = "프레임 " + (index + 1) + " / " + frameButtons.length;
  frameButtons.forEach((button, position) => {
    button.setAttribute("aria-pressed", String(position === index));
  });
}

frameButtons.forEach((button, index) => {
  button.addEventListener("click", () => selectFrame(index));
  button.addEventListener("keydown", (event) => {
    const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!offset) return;
    event.preventDefault();
    const next = (index + offset + frameButtons.length) % frameButtons.length;
    selectFrame(next);
    frameButtons[next].focus();
  });
});

