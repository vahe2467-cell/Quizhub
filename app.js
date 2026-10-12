let quizzes = [];

const app = document.querySelector("#quiz-app");
const brand = document.querySelector(".brand");
const sidebarLinks = document.querySelectorAll(".quiz-type-btn");

const state = {
  view: "home",
  categoryId: null,
  questionIndex: 0,
  questions: [],
  answers: []
};

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function selectQuestions(questionTuples) {
  return shuffle(questionTuples).slice(0, 5).map(([text, correctAnswer, ...wrongAnswers]) => {
    const options = shuffle([correctAnswer, ...wrongAnswers].map((option, index) => ({
      option,
      isCorrect: index === 0
    })));

    return {
      text,
      options: options.map(({ option }) => option),
      answer: options.findIndex(({ isCorrect }) => isCorrect)
    };
  });
}

function setActiveCategory(categoryId) {
  sidebarLinks.forEach((link, index) => {
    const isActive = quizzes[index]?.id === categoryId;
    link.classList.toggle("active", isActive);
  });
}

function showHome() {
  state.view = "home";
  state.categoryId = null;
  state.questionIndex = 0;
  state.questions = [];
  state.answers = [];
  setActiveCategory(null);

  app.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-info">
        <span class="category">QuizHub</span>
        <span class="question-count">${quizzes.length} quizzes available</span>
      </div>
    </div>
    <div class="quiz-body">
      <h2 class="question-text">Choose a category to begin</h2>
      <div class="options-container">
        ${quizzes.map((quiz) => `
          <a class="option-card" href="#${quiz.id}" data-action="start" data-category="${quiz.id}" style="color: inherit; text-decoration: none;">
            <span class="option-prefix">${quiz.icon}</span>
            <span class="option-text">${quiz.name} Quiz</span>
          </a>
        `).join("")}
      </div>
    </div>
  `;
}

function startQuiz(categoryId) {
  const quiz = quizzes.find((item) => item.id === categoryId);
  if (!quiz) return;

  state.view = "quiz";
  state.categoryId = categoryId;
  state.questionIndex = 0;
  state.questions = selectQuestions(quiz.questions);
  state.answers = Array(state.questions.length).fill(null);
  setActiveCategory(categoryId);
  renderQuestion();
}

function renderQuestion() {
  const quiz = quizzes.find((item) => item.id === state.categoryId);
  if (!quiz) return showHome();

  const question = state.questions[state.questionIndex];
  const selectedAnswer = state.answers[state.questionIndex];
  const progress = ((state.questionIndex + 1) / state.questions.length) * 100;

  app.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-info">
        <span class="category">${quiz.name}</span>
        <span class="question-count">Question ${state.questionIndex + 1} of ${state.questions.length}</span>
      </div>
      <div class="progress-bar" aria-label="Quiz progress">
        <div class="progress" style="width: ${progress}%;"></div>
      </div>
    </div>
    <div class="quiz-body">
      <h2 class="question-text">${question.text}</h2>
      <div class="options-container">${question.options.map((option, index) => `<label class="option-card${selectedAnswer === index ? " selected" : ""}"><input type="radio" name="answer" value="${index}"${selectedAnswer === index ? " checked" : ""}><span class="option-prefix">${String.fromCharCode(65 + index)}</span><span class="option-text">${option}</span></label>`).join("")}</div>
    </div>
    <footer class="quiz-footer">
      <button class="btn btn-secondary" type="button" data-action="${state.questionIndex === 0 ? "home" : "previous"}">
        ${state.questionIndex === 0 ? "All Quizzes" : "Previous"}
      </button>
      <button class="btn btn-primary" type="button" data-action="next"${selectedAnswer === null ? " disabled" : ""}>
        ${state.questionIndex === quiz.questions.length - 1 ? "See Results" : "Next Question"}
      </button>
    </footer>
  `;
}

function showResults() {
  const quiz = quizzes.find((item) => item.id === state.categoryId);
  if (!quiz) return showHome();

  const score = state.questions.reduce((total, question, index) => {
    return total + (state.answers[index] === question.answer ? 1 : 0);
  }, 0);

  state.view = "results";
  app.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-info">
        <span class="category">${quiz.name}</span>
        <span class="question-count">Quiz Completed</span>
      </div>
      <div class="progress-bar" aria-label="Quiz complete">
        <div class="progress" style="width: 100%;"></div>
      </div>
    </div>
    <div class="quiz-body">
      <h2 class="question-text">Դուք վաստակեցիք ${score} միավոր ${state.questions.length} ից։</h2>
      <p>${score === state.questions.length ? "🎉 Հիանալի Արդյունք." : "Լավ արդյունք բայց կարող եք փորձել կրկին."}</p>
    </div>
    <footer class="quiz-footer">
      <button class="btn btn-secondary" type="button" data-action="home">Դեպի Տուն</button>
      <button class="btn btn-primary" type="button" data-action="restart">Փորձել կրկին</button>
    </footer>
  `;
}

/* Event Handling */
app.addEventListener("change", (event) => {
  if (event.target.matches('input[name="answer"]')) {
    const selectedIndex = Number(event.target.value);
    state.answers[state.questionIndex] = selectedIndex;

    const cards = app.querySelectorAll(".option-card");
    cards.forEach((card, idx) => {
      card.classList.toggle("selected", idx === selectedIndex);
    });

    const nextBtn = app.querySelector('[data-action="next"]');
    if (nextBtn) nextBtn.disabled = false;
  }
});

app.addEventListener("click", (event) => {
  const control = event.target.closest("[data-action]");
  if (!control) return;

  event.preventDefault();
  const { action, category } = control.dataset;

  if (action === "start") startQuiz(category);
  if (action === "home") showHome();
  if (action === "restart") startQuiz(state.categoryId);
  if (action === "previous" && state.questionIndex > 0) {
    state.questionIndex -= 1;
    renderQuestion();
  }
  if (action === "next" && state.answers[state.questionIndex] !== null) {
    const quiz = quizzes.find((item) => item.id === state.categoryId);
    if (state.questionIndex === state.questions.length - 1) {
      showResults();
    } else {
      state.questionIndex += 1;
      renderQuestion();
    }
  }
});

sidebarLinks.forEach((link, index) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    startQuiz(quizzes[index].id);
  });
});

brand.setAttribute("role", "button");
brand.setAttribute("tabindex", "0");
brand.setAttribute("aria-label", "QuizHub home");
brand.addEventListener("click", showHome);
brand.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    showHome();
  }
});

async function loadQuizzes() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error(`Could not load quiz data (${response.status})`);
    const data = await response.json();
    quizzes = data.quizzes;
    showHome();
  } catch (error) {
    app.innerHTML = '<p class="quiz-body" role="alert">Unable to load quizzes. Please run this page from a local web server and try again.</p>';
    console.error(error);
  }
}

loadQuizzes();