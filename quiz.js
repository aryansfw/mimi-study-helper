let queue = [];
let reviewedCount = 0;

const els = {
  progress: document.getElementById("progress"),
  emptyState: document.getElementById("empty-state"),
  quizState: document.getElementById("quiz-state"),
  doneState: document.getElementById("done-state"),
  doneMessage: document.getElementById("done-message"),
  front: document.getElementById("front"),
  answer: document.getElementById("answer"),
  explanationToggle: document.getElementById("explanation-toggle"),
  explanation: document.getElementById("explanation"),
  showAnswerBtn: document.getElementById("show-answer"),
  gotItBtn: document.getElementById("got-it"),
  reviewAgainBtn: document.getElementById("review-again"),
  restartBtn: document.getElementById("restart")
};

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function start() {
  const { flashcards = [] } = await browser.storage.local.get("flashcards");

  els.emptyState.hidden = flashcards.length > 0;
  els.doneState.hidden = true;
  els.quizState.hidden = flashcards.length === 0;
  els.progress.textContent = "";

  if (flashcards.length === 0) return;

  queue = shuffle(flashcards);
  reviewedCount = 0;
  showNext();
}

function showNext() {
  if (queue.length === 0) {
    els.quizState.hidden = true;
    els.doneState.hidden = false;
    els.doneMessage.textContent = `All caught up. ${reviewedCount} card${reviewedCount === 1 ? "" : "s"} reviewed.`;
    return;
  }

  const current = queue[0];
  els.progress.textContent = `${queue.length} remaining`;

  els.front.textContent = current.front;
  els.answer.textContent = current.answer;
  els.answer.hidden = true;
  els.explanation.textContent = current.explanation;
  els.explanation.hidden = true;
  els.explanationToggle.hidden = true;
  els.explanationToggle.textContent = "See full explanation";

  els.showAnswerBtn.hidden = false;
  els.gotItBtn.hidden = true;
  els.reviewAgainBtn.hidden = true;
}

els.showAnswerBtn.addEventListener("click", () => {
  els.answer.hidden = false;
  els.explanationToggle.hidden = false;
  els.showAnswerBtn.hidden = true;
  els.gotItBtn.hidden = false;
  els.reviewAgainBtn.hidden = false;
});

els.explanationToggle.addEventListener("click", () => {
  const willShow = els.explanation.hidden;
  els.explanation.hidden = !willShow;
  els.explanationToggle.textContent = willShow ? "Hide full explanation" : "See full explanation";
});

els.gotItBtn.addEventListener("click", () => {
  queue.shift();
  reviewedCount++;
  showNext();
});

els.reviewAgainBtn.addEventListener("click", () => {
  queue.push(queue.shift());
  showNext();
});

els.restartBtn.addEventListener("click", start);

start();
