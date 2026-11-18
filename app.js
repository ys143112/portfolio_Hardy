"use strict";

{
  const spritePair = document.querySelector(".sprite-pair");
  const playOriginal = spritePair.querySelector(".play-original");
  const firstFrame = spritePair.querySelector(".first-frame");
  const animatedFrame = spritePair.querySelector(".animated-frame");
  const picker = spritePair.querySelector(".frame-picker");
  const preview = spritePair.querySelector(".frame-preview");
  const croppedStrip = preview.querySelector("img");
  const indexLabel = preview.querySelector(".frame-index");
  const frames = [...picker.querySelectorAll("input")];

  function showSelectedFrame() {
    const index = frames.findIndex((frame) => frame.checked);
    croppedStrip.style.transform = `translateX(${-100 * index / frames.length}%)`;
    indexLabel.textContent = `${index + 1} / ${frames.length}`;
  }

  playOriginal.addEventListener("click", () => {
    const startPlaying = animatedFrame.hidden;
    firstFrame.hidden = startPlaying;
    animatedFrame.hidden = !startPlaying;
    playOriginal.textContent = startPlaying ? "GIF 정지" : "GIF 재생";
  });
  picker.addEventListener("change", showSelectedFrame);
  showSelectedFrame();
  spritePair.classList.add("can-inspect");
  playOriginal.hidden = false;
  picker.hidden = false;
  preview.hidden = false;
}

{
  const worksheet = document.querySelector(".worksheet");
  const table = worksheet.querySelector(".ledger");
  const sampleButton = worksheet.querySelector(".sample-receipt");
  const resetButton = worksheet.querySelector(".restore-invoices");
  const count = worksheet.querySelector(".review-count");
  const message = worksheet.querySelector(".invoice-message");
  const editor = document.querySelector("#invoice-editor").content.firstElementChild.cloneNode(true);
  const form = editor.querySelector("form");
  const receipt = form.elements.namedItem("receipt");
  const amountInput = form.elements.namedItem("amount");
  const error = form.querySelector(".edit-error");
  const formatter = new Intl.NumberFormat("ko-KR");
  const trades = new Map();
  let editing = null;

  function loadNumber(cell) {
    return Number(cell.textContent.trim().replaceAll(",", ""));
  }

  function closeEditor(focusButton = false) {
    if (!editing) return;
    const button = editing.button;
    button.setAttribute("aria-expanded", "false");
    button.removeAttribute("aria-controls");
    editor.remove();
    editing = null;
    if (focusButton) button.focus();
  }

  function clearError() {
    error.hidden = true;
    error.textContent = "";
    amountInput.removeAttribute("aria-invalid");
    amountInput.removeAttribute("aria-describedby");
  }

  function openEditor(trade) {
    if (editing === trade) {
      closeEditor(true);
      return;
    }
    closeEditor();
    editing = trade;
    message.textContent = "";
    clearError();
    form.querySelector("legend").textContent = trade.id + " 인보이스 수정";
    receipt.value = trade.received ? "received" : "missing";
    amountInput.disabled = !trade.received;
    amountInput.value = trade.amount === null ? "" : formatter.format(trade.amount);
    trade.row.after(editor);
    trade.button.setAttribute("aria-expanded", "true");
    trade.button.setAttribute("aria-controls", editor.id);
    if (trade.received) {
      amountInput.focus();
      amountInput.select();
    } else {
      receipt.focus();
    }
  }

  function resultFor(trade) {
    if (!trade.received) return {label: "증빙 미도착", action: "인보이스를 요청하세요."};
    if (trade.amount === null) return {label: "증빙 금액 확인", action: "도착한 인보이스의 금액을 입력하세요."};
    const difference = trade.amount - trade.ledger;
    if (difference === 0) return {label: "일치", action: "원장과 인보이스 금액이 같습니다."};
    const sign = difference > 0 ? "+" : "−";
    return {label: sign + formatter.format(Math.abs(difference)) + "원 차이", action: "청구 금액을 다시 확인하세요."};
  }

  function render() {
    let review = 0;
    let changed = false;
    for (const trade of trades.values()) {
      const needsReview = !trade.received || trade.amount === null || trade.amount !== trade.ledger;
      if (needsReview) review++;
      if (trade.received !== trade.originalReceived || trade.amount !== trade.originalAmount) changed = true;
      let label = "미도착";
      if (trade.received) label = trade.amount === null ? "금액 미입력" : formatter.format(trade.amount);
      trade.button.textContent = label;
      trade.button.setAttribute("aria-label", trade.id + " 인보이스 수정, " + label + (trade.amount === null ? "" : "원"));
      trade.row.classList.toggle("flagged", needsReview);
      trade.row.cells[3].textContent = resultFor(trade).label;
    }
    count.textContent = "확인 필요 " + review + "건 / 전체 " + trades.size + "건";
    resetButton.disabled = !changed;
    const example = trades.get("H-103");
    sampleButton.disabled = example.received && example.amount === example.ledger;
  }

  function applyReceipt(trade, received, amount) {
    trade.received = received;
    trade.amount = amount;
    render();
    const result = resultFor(trade);
    message.textContent = trade.id + " · " + result.label + ". " + result.action;
  }

  for (const row of table.tBodies[0].rows) {
    const id = row.cells[0].textContent.trim();
    const originalReceived = row.cells[2].textContent.trim() !== "—";
    const originalAmount = originalReceived ? loadNumber(row.cells[2]) : null;
    const button = document.createElement("button");
    const trade = {id, row, button, ledger: loadNumber(row.cells[1]), originalReceived, originalAmount,
      received: originalReceived, amount: originalAmount};
    button.type = "button";
    button.className = "edit-invoice";
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => openEditor(trade));
    row.cells[2].replaceChildren(button);
    trades.set(id, trade);
  }

  editor.id = "invoice-edit-row";
  receipt.addEventListener("change", () => {
    clearError();
    amountInput.disabled = receipt.value === "missing";
    if (!amountInput.disabled) amountInput.focus();
  });
  amountInput.addEventListener("input", clearError);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const received = receipt.value === "received";
    const raw = amountInput.value.trim();
    let amount = null;
    if (received && raw !== "") {
      amount = Number(raw.replaceAll(",", ""));
      const validFormat = /^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(raw);
      if (!validFormat || !Number.isSafeInteger(amount) || !Number.isSafeInteger(amount - editing.ledger)) {
        error.textContent = "금액을 원 단위 정수로 입력하세요. 예: 64,000";
        error.hidden = false;
        amountInput.setAttribute("aria-invalid", "true");
        amountInput.setAttribute("aria-describedby", error.id);
        amountInput.focus();
        return;
      }
      if (Object.is(amount, -0)) amount = 0;
    }
    applyReceipt(editing, received, amount);
    closeEditor(true);
  });
  form.querySelector(".cancel-edit").addEventListener("click", () => closeEditor(true));
  form.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeEditor(true);
    }
  });
  sampleButton.addEventListener("click", () => {
    closeEditor();
    const trade = trades.get("H-103");
    applyReceipt(trade, true, trade.ledger);
    trade.button.focus();
  });
  resetButton.addEventListener("click", () => {
    closeEditor();
    for (const trade of trades.values()) {
      trade.received = trade.originalReceived;
      trade.amount = trade.originalAmount;
    }
    render();
    message.textContent = "네 거래를 처음 예시로 복원했습니다.";
    sampleButton.focus();
  });

  render();
  worksheet.querySelector(".invoice-tools").hidden = false;
  worksheet.querySelector(".ledger-hint").hidden = false;
}

