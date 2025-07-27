const FlashcardQuiz = {
    questions: [],
    
    config: {
        messages: {
            fetchError: 'Failed to fetch questions. Please try again.',
            noQuestions: 'No questions available. Please generate a quiz first!',
            correctAnswer: '✓ Correct!',
            wrongAnswer: '✗ Wrong! The correct answer is: '
        },
        apiUrl: 'https://opentdb.com/api.php'
    },

    // Utility functions
    $(id) { return document.getElementById(id); },
    toggle(el, show = true) { if (el) el.hidden = !show; },
    setText(id, text) { this.$(id).textContent = text; },
    
    // Decode HTML entities from API response
    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    },

    // Build API URL with parameters
    buildApiUrl(params) {
        const url = new URL(this.config.apiUrl);
        Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.append(key, value);
        });
        return url.toString();
    },

    // Get form data for API request
    getQuizConfig() {
        const fields = ['amount', 'category', 'difficulty', 'type'];
        return Object.fromEntries(fields.map(field => [field, this.$(field).value]));
    },

    // Toggle button loading state
    toggleButtonLoading(btnId, isLoading) {
        const btn = this.$(btnId);
        const text = btn.querySelector('.btn-text');
        const loading = btn.querySelector('.btn-loading');
        
        btn.disabled = isLoading;
        this.toggle(text, !isLoading);
        this.toggle(loading, isLoading);
    },

    // Fetch questions from API
    async fetchQuestions(config) {
        const apiUrl = this.buildApiUrl(config);
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.response_code !== 0) {
                throw new Error('API returned no results');
            }
            
            return data.results.map(q => this.formatQuestion(q));
        } catch (error) {
            console.error('Fetch error:', error);
            throw new Error(this.config.messages.fetchError);
        }
    },

    // Shuffle array in place
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    // Format API question to our format
    formatQuestion(apiQuestion) {
        const question = this.decodeHtml(apiQuestion.question);
        const correctAnswer = this.decodeHtml(apiQuestion.correct_answer);
        const incorrectAnswers = apiQuestion.incorrect_answers.map(ans => this.decodeHtml(ans));
        
        // Prepare options based on type
        const options = apiQuestion.type === 'boolean' 
            ? ['True', 'False']
            : this.shuffle([...incorrectAnswers, correctAnswer]);
        
        return {
            id: Date.now() + Math.random(),
            question,
            options,
            correctAnswer,
            correctIndex: options.indexOf(correctAnswer),
            category: this.decodeHtml(apiQuestion.category),
            difficulty: apiQuestion.difficulty
        };
    },

    // Save questions to localStorage
    saveToLocal() {
        localStorage.setItem('flashcardQuizQuestions', JSON.stringify(this.questions));
    },

    // Load questions from localStorage
    loadFromLocal() {
        const saved = localStorage.getItem('flashcardQuizQuestions');
        if (saved) {
            this.questions = JSON.parse(saved);
        }
    },

    // Generate quiz from API
    async generateQuiz(event) {
        event.preventDefault();
        this.toggleButtonLoading('generate-btn', true);
        try {
            const config = this.getQuizConfig();
            this.questions = await this.fetchQuestions(config);
            this.saveToLocal(); // Save after fetching
            this.updateUI();
            this.toggle(this.$('preview'), true);
            this.toggle(this.$('start'), true);
        } catch (error) {
            alert(error.message);
        } finally {
            this.toggleButtonLoading('generate-btn', false);
        }
    },

    // Create question metadata HTML
    createQuestionMeta(q, index) {
        return `
            <div class="question-meta">
                <span class="question-number">Q${index + 1}</span>
                <span class="question-category">${q.category}</span>
                <span class="question-difficulty">${q.difficulty}</span>
            </div>
        `;
    },

    // Update question preview
    updateUI() {
        this.setText('count', this.questions.length);
        this.$('list').innerHTML = this.questions.map((q, i) => `
            <div class="question-item">
                ${this.createQuestionMeta(q, i)}
                <div class="question-text">${q.question}</div>
                <div class="question-options">${q.options.join(' • ')} → <strong>${q.correctAnswer}</strong></div>
            </div>
        `).join('');
    },

    // Start quiz
    startQuiz() {
        if (this.questions.length === 0) {
            alert(this.config.messages.noQuestions);
            return;
        }
        
        this.toggle(this.$('creator'), false);
        this.toggle(this.$('quiz'), true);
        this.renderQuiz();
    },

    // Return to creator
    returnToCreator() {
        this.toggle(this.$('creator'), true);
        this.toggle(this.$('quiz'), false);
    },

    // Create quiz controls HTML
    createQuizControls() {
        return `
            <div class="quiz-controls">
                <button class="btn btn-primary" onclick="FlashcardQuiz.returnToCreator()">Back to Generator</button>
                <button class="btn btn-success" onclick="FlashcardQuiz.startQuiz()">Restart Quiz</button>
            </div>
        `;
    },

    // Create quiz card HTML
    createQuizCard(q, index) {
        return `
            <div class="quiz-card">
                <div class="quiz-meta">
                    <span class="quiz-category">${q.category}</span>
                    <span class="quiz-difficulty">${q.difficulty}</span>
                </div>
                <h3 class="quiz-question">Question ${index + 1}</h3>
                <p class="quiz-question-text">${q.question}</p>
                <div class="quiz-options">
                    ${q.options.map(opt => `
                        <button class="quiz-option" onclick="FlashcardQuiz.handleAnswer(this, '${q.correctAnswer}')">${opt}</button>
                    `).join('')}
                </div>
                <div class="quiz-feedback" hidden></div>
            </div>
        `;
    },

    // Render quiz interface
    renderQuiz() {
        this.$('quiz').innerHTML = this.createQuizControls() + 
            this.questions.map((q, i) => this.createQuizCard(q, i)).join('');
    },

    // Handle answer selection
    handleAnswer(button, correctAnswer) {
        const card = button.closest('.quiz-card');
        const options = card.querySelectorAll('.quiz-option');
        const feedback = card.querySelector('.quiz-feedback');
        
        options.forEach(opt => opt.disabled = true);
        
        const isCorrect = button.textContent === correctAnswer;
        button.classList.add(isCorrect ? 'correct' : 'wrong');
        
        if (!isCorrect) {
            options.forEach(opt => {
                if (opt.textContent === correctAnswer) opt.classList.add('correct');
            });
        }
        
        feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`;
        feedback.textContent = isCorrect ? 
            this.config.messages.correctAnswer : 
            `${this.config.messages.wrongAnswer}${correctAnswer}`;
        
        this.toggle(feedback, true);
    },

    // Initialize application
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadFromLocal(); // Load saved questions
            this.$('quiz-config').addEventListener('submit', (e) => this.generateQuiz(e));
            this.$('start').addEventListener('click', () => this.startQuiz());
            this.updateUI();
            if (this.questions.length) {
                this.toggle(this.$('preview'), true);
                this.toggle(this.$('start'), true);
            }
        });
    }
};

FlashcardQuiz.init();



