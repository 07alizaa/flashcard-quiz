
const FlashcardQuiz = {
    questions: [],
    optionLabels: ['A', 'B', 'C', 'D'],
    
    config: {
        messages: {
            fillAllFields: 'Please fill in all fields!',
            noQuestions: 'Please add questions first!',
            confirmClear: 'Are you sure you want to clear all questions?',
            noQuestionsToDelete: 'No questions to clear!',
            correctAnswer: '✓ Correct!',
            wrongAnswer: '✗ Wrong! The correct answer is: '
        }
    },

    // Utility functions
    $(id) { return document.getElementById(id); },
    hide(el) { if (el) el.hidden = true; },
    show(el) { if (el) el.hidden = false; },

    // Generate option inputs dynamically
    generateOptions() {
        const container = this.$('options-container');
        const select = this.$('correct');
        
        // Generate option inputs
        container.innerHTML = this.optionLabels.map((label, i) => `
            <div class="form-group">
                <label class="form-label">Option ${label}</label>
                <input id="opt${i + 1}" placeholder="Option ${label}" required class="form-input">
            </div>
        `).join('');
        
        // Generate select options
        select.innerHTML = `
            <option value="">Select correct answer</option>
            ${this.optionLabels.map((label, i) => `<option value="${i}">Option ${label}</option>`).join('')}
        `;
    },

    // Get and validate form data
    getFormData() {
        const question = this.$('question').value.trim();
        const options = this.optionLabels.map((_, i) => this.$(`opt${i + 1}`).value.trim());
        const correctIndex = parseInt(this.$('correct').value);
        
        return {
            question,
            options,
            correctIndex,
            correctAnswer: options[correctIndex],
            isValid: question && options.every(opt => opt) && !isNaN(correctIndex)
        };
    },

    // Add question
    addQuestion(event) {
        event.preventDefault();
        const formData = this.getFormData();
        
        if (!formData.isValid) {
            alert(this.config.messages.fillAllFields);
            return;
        }
        
        this.questions.push({
            id: Date.now(),
            question: formData.question,
            options: formData.options,
            correctAnswer: formData.correctAnswer,
            correctIndex: formData.correctIndex
        });
        
        this.updateUI();
        this.$('form').reset();
        this.show(this.$('start'));
    },

    // Delete question
    deleteQuestion(index) {
        this.questions.splice(index, 1);
        this.updateUI();
        if (this.questions.length === 0) this.hide(this.$('start'));
    },

    // Clear all questions
    clearAll() {
        if (this.questions.length === 0) {
            alert(this.config.messages.noQuestionsToDelete);
            return;
        }
        
        if (confirm(this.config.messages.confirmClear)) {
            this.questions = [];
            this.updateUI();
            this.hide(this.$('start'));
        }
    },

    // Update question preview
    updateUI() {
        this.$('count').textContent = this.questions.length;
        this.$('list').innerHTML = this.questions.map((q, i) => `
            <div class="question-item">
                <div class="question-text"><strong>Question ${i + 1}:</strong> ${q.question}</div>
                <div class="question-options">${q.options.join(' • ')} → <strong>${q.correctAnswer}</strong></div>
                <button onclick="FlashcardQuiz.deleteQuestion(${i})" class="delete-btn">×</button>
            </div>
        `).join('');
    },

    // Start quiz
    startQuiz() {
        if (this.questions.length === 0) {
            alert(this.config.messages.noQuestions);
            return;
        }
        
        this.hide(this.$('creator'));
        this.show(this.$('quiz'));
        this.renderQuiz();
    },

    // Return to creator
    returnToCreator() {
        this.show(this.$('creator'));
        this.hide(this.$('quiz'));
    },

    // Render quiz interface
    renderQuiz() {
        this.$('quiz').innerHTML = `
            <div class="quiz-controls">
                <button class="btn btn-primary" onclick="FlashcardQuiz.returnToCreator()">Back to Creator</button>
                <button class="btn btn-success" onclick="FlashcardQuiz.startQuiz()">Restart Quiz</button>
            </div>
            ${this.questions.map((q, i) => `
                <div class="quiz-card">
                    <h3 class="quiz-question">Question ${i + 1}</h3>
                    <p class="quiz-question-text">${q.question}</p>
                    <div class="quiz-options">
                        ${q.options.map(opt => `
                            <button class="quiz-option" onclick="FlashcardQuiz.handleAnswer(this, '${q.correctAnswer}')">${opt}</button>
                        `).join('')}
                    </div>
                    <div class="quiz-feedback" hidden></div>
                </div>
            `).join('')}
        `;
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
        
        this.show(feedback);
    },

    // Initialize application
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.generateOptions(); // Generate form options dynamically
            this.$('form').addEventListener('submit', (e) => this.addQuestion(e));
            this.$('start').addEventListener('click', () => this.startQuiz());
            this.$('clear').addEventListener('click', () => this.clearAll());
            this.updateUI();
        });
    }
};

FlashcardQuiz.init();



