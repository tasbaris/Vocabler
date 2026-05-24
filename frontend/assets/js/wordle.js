document.addEventListener('DOMContentLoaded', () => {
    const wordleGrid = document.querySelector('.wordle-grid');
    const keyboardButtons = document.querySelectorAll('.key-btn');
    const messageContainer = document.createElement('div');
    messageContainer.id = 'wordle-message';
    messageContainer.className = 'mt-3 fw-bold';
    document.querySelector('.container-fluid').appendChild(messageContainer);

    let targetWord = "";
    let wordHint = "";
    let currentGuess = "";
    let guesses = [];
    const maxGuesses = 6;
    const wordLength = 5;
    let gameOver = false;

    // Fetch a random word from the backend
    async function fetchWord() {
        try {
            const response = await fetch(`${API_BASE_URL}/words/get_wordle_word.php?length=${wordLength}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('vocabler_token')}`
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                targetWord = data.word.toUpperCase();
                wordHint = data.hint;
                updateTitleWithHint();
                initGrid();
            } else {
                showMessage(t('wordle_load_error') + ": " + data.message, "danger");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            showMessage(t('msg_connection_error'), "danger");
        }
    }

    function updateTitleWithHint() {
        const titleElem = document.querySelector('[data-i18n="feature_wordle_desc"]');
        if (titleElem) {
            titleElem.textContent = `${t('wordle_hint')}: ${wordHint}`;
        }
    }

    function initGrid() {
        wordleGrid.innerHTML = '';
        for (let i = 0; i < maxGuesses; i++) {
            const row = document.createElement('div');
            row.className = 'wordle-row';
            for (let j = 0; j < wordLength; j++) {
                const cell = document.createElement('div');
                cell.className = 'wordle-cell';
                row.appendChild(cell);
            }
            wordleGrid.appendChild(row);
        }
    }

    function updateGrid() {
        const rows = wordleGrid.querySelectorAll('.wordle-row');
        const currentRow = rows[guesses.length];
        const cells = currentRow.querySelectorAll('.wordle-cell');

        cells.forEach((cell, i) => {
            cell.textContent = currentGuess[i] || '';
            if (currentGuess[i]) {
                cell.classList.add('active');
            } else {
                cell.classList.remove('active');
            }
        });

        // Auto submit if length reached
        if (currentGuess.length === wordLength) {
            setTimeout(() => submitGuess(), 200);
        }
    }

    async function submitGuess() {
        if (currentGuess.length !== wordLength || gameOver) return;

        const rows = wordleGrid.querySelectorAll('.wordle-row');
        const currentRow = rows[guesses.length];
        const cells = currentRow.querySelectorAll('.wordle-cell');
        
        const guessArray = currentGuess.split('');
        const targetArray = targetWord.split('');
        const result = new Array(wordLength).fill('absent');
        
        // First pass: find correct letters
        const targetLetterCounts = {};
        targetArray.forEach(char => {
            targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
        });

        guessArray.forEach((char, i) => {
            if (char === targetArray[i]) {
                result[i] = 'correct';
                targetLetterCounts[char]--;
            }
        });

        // Second pass: find present letters
        guessArray.forEach((char, i) => {
            if (result[i] !== 'correct' && targetLetterCounts[char] > 0) {
                result[i] = 'present';
                targetLetterCounts[char]--;
            }
        });

        // Update UI
        cells.forEach((cell, i) => {
            setTimeout(() => {
                cell.classList.add(result[i]);
                updateKeyboard(guessArray[i], result[i]);
            }, i * 100);
        });

        guesses.push(currentGuess);
        
        if (currentGuess === targetWord) {
            gameOver = true;
            setTimeout(() => showMessage(t('wordle_success'), "success"), wordLength * 100);
        } else if (guesses.length === maxGuesses) {
            gameOver = true;
            setTimeout(() => showMessage(`${t('wordle_fail')}: ${targetWord}`, "danger"), wordLength * 100);
        }

        currentGuess = "";
    }

    function updateKeyboard(letter, status) {
        keyboardButtons.forEach(btn => {
            if (btn.textContent.trim().toUpperCase() === letter) {
                if (status === 'correct') {
                    btn.classList.remove('present', 'absent');
                    btn.classList.add('correct');
                } else if (status === 'present' && !btn.classList.contains('correct')) {
                    btn.classList.remove('absent');
                    btn.classList.add('present');
                } else if (status === 'absent' && !btn.classList.contains('correct') && !btn.classList.contains('present')) {
                    btn.classList.add('absent');
                }
            }
        });
    }

    function handleInput(key) {
        if (gameOver) return;

        if (key === 'BACKSPACE' || key === 'DELETE') {
            currentGuess = currentGuess.slice(0, -1);
            updateGrid();
        } else if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) {
            currentGuess += key;
            updateGrid();
        }
    }

    function showMessage(msg, type) {
        messageContainer.textContent = msg;
        messageContainer.className = `mt-3 fw-bold text-${type}`;
    }

    // Keyboard events
    window.addEventListener('keydown', (e) => {
        const key = e.key.toUpperCase();
        if (key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
            handleInput(key);
        }
    });

    // On-screen keyboard events
    keyboardButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            let key = btn.textContent.trim().toUpperCase();
            if (btn.querySelector('.fa-backspace')) key = 'BACKSPACE';
            if (key !== 'ENTER') handleInput(key);
        });
    });

    fetchWord();
});
