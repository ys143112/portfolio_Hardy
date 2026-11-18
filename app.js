"use strict";

const playButton = document.querySelector(".play-original");
const firstFrame = document.querySelector(".first-frame");
const animatedFrame = document.querySelector(".animated-frame");

playButton.hidden = false;
playButton.addEventListener("click", () => {
  const startPlaying = animatedFrame.hidden;
  firstFrame.hidden = startPlaying;
  animatedFrame.hidden = !startPlaying;
  playButton.textContent = startPlaying ? "GIF 정지" : "GIF 재생";
});

