"use strict";

const modeChoices = document.querySelectorAll('input[name="summary-mode"]');
const modeHeading = document.getElementById("mode-heading");
const modeCopy = document.getElementById("mode-copy");

function updateSummaryMode(event) {
  const isManual = event.target.value === "manual";
  modeHeading.textContent = isManual ? "이용자가 편집한 요약 유지" : "정정 내용으로 요약 갱신";
  modeCopy.textContent = isManual
    ? "기존 진술 아래에 정정을 덧붙이고, 이용자가 편집한 요약은 보존합니다."
    : "기존 진술에 정정을 덧붙이고 자동 요약을 갱신합니다.";
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

