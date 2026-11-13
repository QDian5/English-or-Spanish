<!-- JavaScript Application Logic 
        // Initial Default Dataset mimicking data.json
        const defaultData = [
            // English
            { id: 1, lang: 'en', word: 'Serendipity', translation: 'Счастливая случайность', description: 'Finding valuable things by chance.', level: 'B2', correct: 3, total: 4 },
            { id: 2, lang: 'en', word: 'Resilient', translation: 'Устойчивый, жизнестойкий', description: 'Able to withstand or recover quickly from difficult conditions.', level: 'C1', correct: 5, total: 5 },
            { id: 3, lang: 'en', word: 'Curious', translation: 'Любопытный', description: 'Eager to know or learn something.', level: 'A2', correct: 2, total: 3 },
            { id: 4, lang: 'en', word: 'Challenge', translation: 'Вызов, сложная задача', description: 'A task or situation that tests someone\'s abilities.', level: 'B1', correct: 4, total: 4 },
            { id: 5, lang: 'en', word: 'Eloquent', translation: 'Красноречивый', description: 'Fluent or persuasive in speaking or writing.', level: 'C2', correct: 1, total: 2 },
            // Spanish
            { id: 6, lang: 'es', word: 'Ojalá', translation: 'Дай бог, надеяться', description: 'Expressing a strong wish or hope.', level: 'B1', correct: 3, total: 3 },
            { id: 7, lang: 'es', word: 'Impresionante', translation: 'Впечатляющий', description: 'Causing admiration or awe.', level: 'A2', correct: 4, total: 5 },
            { id: 8, lang: 'es', word: 'Madrugar', translation: 'Вставать рано утром', description: 'To get up early in the morning.', level: 'B2', correct: 2, total: 4 },
            { id: 9, lang: 'es', word: 'Añorar', translation: 'Тосковать, скучать', description: 'To feel nostalgia or longing for someone or something.', level: 'C1', correct: 1, total: 2 }
        ];

        // State variables
        let currentLang = 'en';
        let activeTab = 'words';
        let words = [];

        // Flashcards state
        let flashcardQueue = [];
        let flashcardIndex = 0;
        let isFlipped = false;

        // Test state
        let testQuestions = [];
        let testIndex = 0;
        let testScoreCount = 0;

        // Input state
        let inputQueue = [];
        let inputIndex = 0;

        // Proper Fisher-Yates shuffle (unbiased)
        function shuffle(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // Initialize App on load
        window.addEventListener('DOMContentLoaded', () => {
            loadDataFromStorage();
            renderCurrentView();
        });

        // Load data from localStorage or fallback to defaultData
        function loadDataFromStorage() {
            const saved = localStorage.getItem('vocab_master_data');
            if (saved) {
                try {
                    words = JSON.parse(saved);
                } catch (e) {
                    words = [...defaultData];
                }
            } else {
                words = [...defaultData];
                saveDataToStorage();
            }
        }

        // Save data to localStorage
        function saveDataToStorage() {
            localStorage.setItem('vocab_master_data', JSON.stringify(words));
        }

        // Toast notification helper
        function showToast(message, isError = false) {
            const toast = document.getElementById('toast');
            const msg = document.getElementById('toast-message');
            const icon = document.getElementById('toast-icon');
            
            msg.textContent = message;
            if (isError) {
                icon.className = 'fa-solid fa-circle-exclamation text-rose-400 text-lg';
            } else {
                icon.className = 'fa-solid fa-circle-check text-emerald-400 text-lg';
            }

            toast.classList.remove('translate-y-[-150%]');
            setTimeout(() => {
                toast.classList.add('translate-y-[-150%]');
            }, 3000);
        }

        // Set Language (en / es)
        function setLanguage(lang) {
            currentLang = lang;
            document.getElementById('lang-en-btn').className = lang === 'en' 
                ? 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 bg-white text-indigo-600 shadow-xs'
                : 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 text-slate-600 hover:text-slate-900';
            document.getElementById('lang-es-btn').className = lang === 'es' 
                ? 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 bg-white text-indigo-600 shadow-xs'
                : 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 text-slate-600 hover:text-slate-900';
            
            document.getElementById('current-lang-title').textContent = lang === 'en' ? 'Английского' : 'Испанского';
            renderCurrentView();
        }

        // Switch Tabs
        function switchTab(tab) {
            activeTab = tab;
            const tabs = ['words', 'flashcards', 'test', 'input', 'stats'];
            tabs.forEach(t => {
                const section = document.getElementById(`section-${t}`);
                const btn = document.getElementById(`nav-btn-${t}`);
                if (t === tab) {
                    section.classList.remove('hidden');
                    btn.className = 'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-indigo-600 transition-all font-bold';
                } else {
                    section.classList.add('hidden');
                    btn.className = 'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-400 hover:text-slate-600 transition-all';
                }
            });
            renderCurrentView();
        }

        function renderCurrentView() {
            if (activeTab === 'words') renderWordsList();
            else if (activeTab === 'flashcards') initFlashcards();
            else if (activeTab === 'test') startTest();
            else if (activeTab === 'input') startInputMode();
            else if (activeTab === 'stats') renderStats();
        }

        // --- SECTION 1: WORDS LIST ---
        function renderWordsList() {
            const container = document.getElementById('words-container');
            const search = document.getElementById('word-search').value.toLowerCase();
            const levelFilter = document.getElementById('level-filter').value;

            const filtered = words.filter(w => {
                if (w.lang !== currentLang) return false;
                if (levelFilter && w.level !== levelFilter) return false;
                if (search && !w.word.toLowerCase().includes(search) && !w.translation.toLowerCase().includes(search)) return false;
                return true;
            });

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full py-12 text-center space-y-3">
                        <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-lg">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                        <p class="text-sm text-slate-500 font-medium">Слов не найдено. Добавьте первое слово!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map(w => `
                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-indigo-200 transition-all">
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">${w.level}</span>
                                <h3 class="text-base font-bold text-slate-900">${w.word}</h3>
                            </div>
                            <p class="text-sm font-semibold text-indigo-900 mt-1">${w.translation}</p>
                        </div>
                        <button onclick="deleteWord(${w.id})" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors" title="Удалить">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed">${w.description}</p>
                    <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        <span>Успех: ${w.total > 0 ? Math.round((w.correct / w.total) * 100) : 0}%</span>
                        <span>Попыток: ${w.total}</span>
                    </div>
                </div>
            `).join('');
        }

        // Add Word Modal Handlers
        function openAddWordModal() {
            document.getElementById('modal-lang-label').textContent = currentLang === 'en' ? 'Английский' : 'Испанский';
            document.getElementById('add-word-modal').classList.remove('hidden');
        }

        function closeAddWordModal() {
            document.getElementById('add-word-modal').classList.add('hidden');
            document.getElementById('new-word').value = '';
            document.getElementById('new-translation').value = '';
            document.getElementById('new-description').value = '';
        }

        function handleAddWordSubmit(event) {
            event.preventDefault();
            const newWordObj = {
                id: Date.now(),
                lang: currentLang,
                word: document.getElementById('new-word').value.trim(),
                translation: document.getElementById('new-translation').value.trim(),
                description: document.getElementById('new-description').value.trim(),
                level: document.getElementById('new-level').value,
                correct: 0,
                total: 0
            };

            words.push(newWordObj);
            saveDataToStorage();
            closeAddWordModal();
            renderWordsList();
            showToast('Слово успешно добавлено!');
        }

        function deleteWord(id) {
            words = words.filter(w => w.id !== id);
            saveDataToStorage();
            renderWordsList();
            showToast('Слово удалено');
        }

        // --- SECTION 2: FLASHCARDS ---
        function initFlashcards() {
            // Shuffle the queue every time the tab is opened
            flashcardQueue = shuffle(words.filter(w => w.lang === currentLang));
            flashcardIndex = 0;
            isFlipped = false;
            showFlashcard();
        }

        function showFlashcard() {
            if (flashcardQueue.length === 0) {
                document.getElementById('flashcards-wrapper').innerHTML = `
                    <div class="py-16 text-center space-y-3">
                        <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-lg">
                            <i class="fa-solid fa-clone"></i>
                        </div>
                        <p class="text-sm text-slate-500 font-medium">Нет слов для карточек в этом языке. Добавьте их в разделе "Слова".</p>
                    </div>
                `;
                return;
            }

            if (flashcardIndex >= flashcardQueue.length) {
                flashcardIndex = 0;
            }

            const w = flashcardQueue[flashcardIndex];
            document.getElementById('fc-level').textContent = w.level;
            document.getElementById('fc-back-level').textContent = w.level;
            document.getElementById('fc-word').textContent = w.word;
            document.getElementById('fc-lang').textContent = currentLang === 'en' ? 'Английский' : 'Испанский';
            document.getElementById('fc-translation').textContent = w.translation;
            document.getElementById('fc-description').textContent = w.description;
            document.getElementById('fc-current').textContent = flashcardIndex + 1;
            document.getElementById('fc-total').textContent = flashcardQueue.length;

            if (isFlipped) {
                flipCard(true); // reset flip state
            }
        }

        function flipCard(forceReset = false) {
            const inner = document.getElementById('flashcard-inner');
            if (forceReset) {
                isFlipped = false;
                inner.classList.remove('rotate-y-180');
                return;
            }
            isFlipped = !isFlipped;
            if (isFlipped) {
                inner.classList.add('rotate-y-180');
            } else {
                inner.classList.remove('rotate-y-180');
            }
        }

        function rateFlashcard(known) {
            const w = flashcardQueue[flashcardIndex];
            const wordRef = words.find(item => item.id === w.id);
            if (wordRef) {
                wordRef.total += 1;
                if (known) wordRef.correct += 1;
                saveDataToStorage();
            }
            flashcardIndex++;
            showFlashcard();
        }

        // --- SECTION 3: TEST ---
        function startTest() {
            const langWords = words.filter(w => w.lang === currentLang);
            if (langWords.length < 2) {
                document.getElementById('test-container').innerHTML = `
                    <div class="py-12 text-center space-y-3">
                        <p class="text-sm text-slate-500 font-medium">Для теста нужно хотя бы 2 слова в словаре текущего языка.</p>
                    </div>
                `;
                return;
            }

            // Proper random shuffle + take up to 5 questions
            testQuestions = shuffle(langWords).slice(0, 5);
            testIndex = 0;
            testScoreCount = 0;
            
            document.getElementById('test-active-view').classList.remove('hidden');
            document.getElementById('test-finished-view').classList.add('hidden');
            document.getElementById('test-total-num').textContent = testQuestions.length;
            renderTestQuestion();
        }

        function renderTestQuestion() {
            if (testIndex >= testQuestions.length) {
                document.getElementById('test-active-view').classList.add('hidden');
                document.getElementById('test-finished-view').classList.remove('hidden');
                const percent = Math.round((testScoreCount / testQuestions.length) * 100);
                document.getElementById('test-final-score').textContent = `${testScoreCount} / ${testQuestions.length} (${percent}%)`;
                return;
            }

            const currentQ = testQuestions[testIndex];
            document.getElementById('test-current-num').textContent = testIndex + 1;
            document.getElementById('test-score-counter').textContent = `Правильно: ${testScoreCount}`;
            document.getElementById('test-word-level').textContent = currentQ.level;
            document.getElementById('test-target-word').textContent = currentQ.word;
            document.getElementById('test-target-desc').textContent = currentQ.description;

            // Generate options (1 correct, up to 3 distractors) with proper shuffle
            const distractors = shuffle(
                words.filter(w => w.lang === currentLang && w.id !== currentQ.id)
            ).slice(0, 3);
            
            const options = shuffle([...distractors, currentQ]);

            const optContainer = document.getElementById('test-options');
            optContainer.innerHTML = options.map(opt => `
                <button onclick="handleTestAnswer(${opt.id}, ${currentQ.id}, this)" class="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-all flex items-center justify-between">
                    <span>${opt.translation}</span>
                    <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>
                </button>
            `).join('');
        }

        function handleTestAnswer(selectedId, correctId, btnElement) {
            const allBtns = document.querySelectorAll('#test-options button');
            allBtns.forEach(b => b.disabled = true);

            const wordRef = words.find(w => w.id === correctId);
            if (wordRef) {
                wordRef.total += 1;
            }

            if (selectedId === correctId) {
                testScoreCount++;
                btnElement.className = 'w-full text-left px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-semibold text-emerald-700 flex items-center justify-between';
                if (wordRef) wordRef.correct += 1;
            } else {
                btnElement.className = 'w-full text-left px-4 py-3 bg-rose-50 border border-rose-300 rounded-xl text-sm font-semibold text-rose-700 flex items-center justify-between';
                // highlight correct
                allBtns.forEach(b => {
                    if (b.textContent.trim().includes(words.find(w => w.id === correctId).translation)) {
                        b.className = 'w-full text-left px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-semibold text-emerald-700 flex items-center justify-between';
                    }
                });
            }

            saveDataToStorage();

            setTimeout(() => {
                testIndex++;
                renderTestQuestion();
            }, 1200);
        }

        // --- SECTION 4: INPUT WORD MODE ---
        function startInputMode() {
            // Shuffle the queue every time the mode is started
            inputQueue = shuffle(words.filter(w => w.lang === currentLang));
            inputIndex = 0;
            
            if (inputQueue.length === 0) {
                document.getElementById('input-active-view').innerHTML = `
                    <div class="py-12 text-center space-y-3">
                        <p class="text-sm text-slate-500 font-medium">Нет слов для тренировки ввода в этом языке.</p>
                    </div>
                `;
                return;
            }

            document.getElementById('input-active-view').classList.remove('hidden');
            document.getElementById('input-finished-view').classList.add('hidden');
            renderInputQuestion();
        }

        function renderInputQuestion() {
            if (inputIndex >= inputQueue.length) {
                document.getElementById('input-active-view').classList.add('hidden');
                document.getElementById('input-finished-view').classList.remove('hidden');
                return;
            }

            const w = inputQueue[inputIndex];
            document.getElementById('input-current-num').textContent = `${inputIndex + 1} / ${inputQueue.length}`;
            document.getElementById('input-lang-badge').textContent = currentLang === 'en' ? 'Английский' : 'Испанский';
            document.getElementById('input-word-level').textContent = w.level;
            document.getElementById('input-translation-prompt').textContent = w.translation;
            document.getElementById('input-description-prompt').textContent = w.description;
            document.getElementById('user-word-input').value = '';
            document.getElementById('input-feedback').classList.add('hidden');
            document.getElementById('user-word-input').disabled = false;
            document.getElementById('user-word-input').focus();
        }
        function checkInputWord(event) {
            event.preventDefault();
            const userVal = document.getElementById('user-word-input').value.trim().toLowerCase();
            const currentW = inputQueue[inputIndex];
            const wordRef = words.find(w => w.id === currentW.id);

            if (wordRef) {
                wordRef.total += 1;
            }

            const feedback = document.getElementById('input-feedback');
            feedback.classList.remove('hidden');
            document.getElementById('user-word-input').disabled = true;

            if (userVal === currentW.word.toLowerCase()) {
                if (wordRef) wordRef.correct += 1;
                feedback.className = 'p-4 rounded-xl text-center text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200';
                feedback.innerHTML = `<i class="fa-solid fa-circle-check mr-1.5"></i> Верно! Точное совпадение.`;
            } else {
                feedback.className = 'p-4 rounded-xl text-center text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200';
                feedback.innerHTML = `<i class="fa-solid fa-circle-xmark mr-1.5"></i> Ошибка. Правильный ответ: <b>${currentW.word}</b>`;
            }

            saveDataToStorage();

            setTimeout(() => {
                inputIndex++;
                renderInputQuestion();
            }, 1800);
        }

        // --- SECTION 5: STATISTICS ---
        function renderStats() {
            const langWords = words.filter(w => w.lang === currentLang);
            const totalWords = langWords.length;
            
            let totalCorrect = 0;
            let totalAttempts = 0;
            langWords.forEach(w => {
                totalCorrect += w.correct;
                totalAttempts += w.total;
            });

            const successRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

            document.getElementById('stat-total-words').textContent = totalWords;
            document.getElementById('stat-success-rate').textContent = `${successRate}%`;
            document.getElementById('stat-active-lang').textContent = currentLang === 'en' ? 'Английский' : 'Испанский';

            // Levels breakdown
            const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const levelNames = {
                'A1': 'A1 (Начальный)',
                'A2': 'A2 (Элементарный)',
                'B1': 'B1 (Средний)',
                'B2': 'B2 (Выше среднего)',
                'C1': 'C1 (Продвинутый)',
                'C2': 'C2 (В совершенстве)'
            };

            const breakdownContainer = document.getElementById('stat-levels-breakdown');
            breakdownContainer.innerHTML = levels.map(lvl => {
                const count = langWords.filter(w => w.level === lvl).length;
                const percent = totalWords > 0 ? Math.round((count / totalWords) * 100) : 0;
                return `
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-semibold">
                            <span class="text-slate-700">${levelNames[lvl]}</span>
                            <span class="text-slate-500">${count} слов (${percent}%)</span>
                        </div>
                        <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // --- EXPORT & IMPORT JSON ---
        function exportJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(words, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `vocab_master_backup_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast('Резервная копия экспортирована!');
        }

        function importJSON(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (Array.isArray(parsed)) {
                        words = parsed;
                        saveDataToStorage();
                        renderCurrentView();
                        showToast('База слов успешно импортирована!');
                    } else {
                        showToast('Неверный формат JSON файла', true);
                    }
                } catch (err) {
                    showToast('Ошибка чтения JSON файла', true);
                }
                event.target.value = '';
            };
            reader.readAsText(file);
        }