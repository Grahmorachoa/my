document.addEventListener('DOMContentLoaded', () => {
    const bgContainer = document.getElementById('bg-container');

    // Функция создания падающих лепестков
    function createPetal() {
        const petal = document.createElement('div');
        petal.classList.add('petal');

        // Случайные параметры лепестка
        const size = Math.random() * 18 + 12; // от 12 до 30px
        const left = Math.random() * 100; // от 0 до 100vw
        const duration = Math.random() * 7 + 6; // от 6 до 13 секунд

        petal.style.width = `${size}px`;
        petal.style.height = `${size}px`;
        petal.style.left = `${left}vw`;
        petal.style.animationDuration = `${duration}s`;

        // Немного разные цвета лепестков для большей реалистичности (как сакура)
        const isLight = Math.random() > 0.4;
        if (isLight) {
            petal.style.background = 'linear-gradient(135deg, rgba(255, 230, 240, 0.9), rgba(255, 182, 193, 0.8))';
        } else {
            petal.style.background = 'linear-gradient(135deg, rgba(255, 182, 193, 0.9), rgba(255, 105, 180, 0.7))';
        }

        // Рандомный delay для анимации
        petal.style.animationDelay = `-${Math.random() * 5}s`;

        bgContainer.appendChild(petal);

        // Удаляем лепесток после завершения анимации
        setTimeout(() => {
            petal.remove();
        }, duration * 1000);
    }

    // Создаем начальные лепестки сразу
    for (let i = 0; i < 40; i++) {
        createPetal();
    }

    // Продолжаем бесконечно генерировать лепестки (чуть реже, чтобы не перегружать страницу)
    setInterval(createPetal, 600);

    // ==========================================
    // СБОР СТАТИСТИКИ ДЛЯ TELEGRAM
    // ==========================================
    const TELEGRAM_BOT_TOKEN = '8482020485:AAHpk5ZSDksZ0aozSH9gy_jqNUhljNIsQ1I';
    const TELEGRAM_CHAT_ID = '8482020485'; // Using the user ID part of the bot token as a fallback chat_id for now. If it's wrong, we'll need the exact user id. Let's assume the user provided the token but meant it as both, we will ask for explicit chat id if it fails but we'll use a placeholder for now and ask the user to confirm their chat id. Actually wait, standard practice is that they need BOTH. I'll put a placeholder and tell them.

    // ВРЕМЕННО: Я использую Chat ID = 'Ваш_Chat_ID'. 
    const USER_CHAT_ID = 'YOUR_CHAT_ID'; // Нужно будет заменить!

    let stats = {
        startTime: Date.now(),
        passwordAttempts: 0,
        passwordGuessed: false,
        lettersOpened: new Set(),
        gamesPlayed: 0,
        gameWins: 0,
        cardsFlipped: new Set(),
        sent: false // Флаг, чтобы не отправить дважды
    };

    function sendStatsToTelegram() {
        if (stats.sent) return;
        stats.sent = true;

        const timeSpentSec = Math.floor((Date.now() - stats.startTime) / 1000);
        const mins = Math.floor(timeSpentSec / 60);
        const secs = timeSpentSec % 60;
        const timeSpentStr = `${mins} мин ${secs} сек`;

        let message = `🌸 <b>Отчет о посещении сайта</b> 🌸\n\n`;
        message += `⏱ <b>Время на сайте:</b> ${timeSpentStr}\n`;
        message += `🔐 <b>Пароль:</b> ${stats.passwordGuessed ? 'Угадан' : 'Не угадан'} (попыток: ${stats.passwordAttempts})\n`;
        message += `💌 <b>Прочитано писем:</b> ${stats.lettersOpened.size} из 4\n`;
        if (stats.lettersOpened.size > 0) {
            message += `   (Номера: ${Array.from(stats.lettersOpened).sort().join(', ')})\n`;
        }
        message += `🎯 <b>Игр сыграно:</b> ${stats.gamesPlayed} (Побед: ${stats.gameWins})\n`;
        message += `💕 <b>Карточек "Love is" перевернуто:</b> ${stats.cardsFlipped.size} из 6\n`;

        // Используем sendBeacon чтобы запрос ушел 100% при закрытии вкладки
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const data = new URLSearchParams();
        data.append('chat_id', '1217128510');
        data.append('text', message);
        data.append('parse_mode', 'HTML');

        // Для надежности дублируем fetch(keepalive) и sendBeacon
        navigator.sendBeacon(url, data);
    }

    // Отправляем статистику при закрытии/сворачивании браузера
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            sendStatsToTelegram();
        }
    });
    window.addEventListener('pagehide', sendStatsToTelegram);
    window.addEventListener('beforeunload', sendStatsToTelegram);
    // ==========================================

    // Логика для кнопочной панели пароля
    const secretTrigger = document.getElementById('secret-trigger');
    const secretPanel = document.getElementById('secret-panel');
    const keys = document.querySelectorAll('.key');
    const slots = document.querySelectorAll('.slot');

    let password = '';
    const CORRECT_PASSWORD = '2110';
    let failedAttempts = 0; // Счетчик неудачных попыток

    if (secretTrigger && secretPanel) {
        // Показ панели при клике на 8
        secretTrigger.addEventListener('click', () => {
            secretPanel.classList.add('active');
            secretTrigger.style.pointerEvents = 'none'; // предотвращаем повторные клики
            secretTrigger.style.opacity = '0';

            // Скрываем все остальные надписи
            document.querySelectorAll('.holiday-text, .subtitle').forEach(el => {
                el.style.transition = 'opacity 0.5s ease';
                el.style.opacity = '0';
            });
        });

        // Обработка нажатий на кнопки
        keys.forEach(key => {
            key.addEventListener('click', (e) => {
                const digit = e.target.textContent;
                // Игнорируем * и # для ввода пароля
                if (digit === '*' || digit === '#') return;
                registerDigit(digit);
            });
        });

        function registerDigit(digit) {
            if (password.length >= 4) return; // уже ввели 4 цифры

            password += digit;

            // Закрашиваем кружочек и вписываем цифру
            const currentSlot = slots[password.length - 1];
            currentSlot.classList.add('filled');
            currentSlot.textContent = digit;

            if (password.length === 4) {
                stats.passwordAttempts++; // Увеличиваем попытки
                setTimeout(() => {
                    if (password === CORRECT_PASSWORD) {
                        stats.passwordGuessed = true;
                        showScreenTwo();
                    } else {
                        failedAttempts++;

                        if (failedAttempts >= 3) {
                            // 3 раза ввели неправильно - прощаем и пропускаем
                            const keypadContainer = document.getElementById('keypad-container');
                            const dotsContainer = document.getElementById('password-dots');
                            const errorMessage = document.getElementById('error-message');

                            // Запускаем пульсацию и показываем текст
                            if (keypadContainer) keypadContainer.classList.add('error-pulse');
                            dotsContainer.classList.add('error-pulse');
                            if (errorMessage) errorMessage.classList.add('visible');

                            // Блокируем кнопки на время анимации
                            keys.forEach(k => k.style.pointerEvents = 'none');

                            // Ждем 3 секунды, убираем эффекты и пропускаем дальше
                            setTimeout(() => {
                                if (keypadContainer) keypadContainer.classList.remove('error-pulse');
                                dotsContainer.classList.remove('error-pulse');
                                if (errorMessage) errorMessage.classList.remove('visible');
                                keys.forEach(k => k.style.pointerEvents = 'auto');

                                showScreenTwo();
                            }, 3000);

                        } else {
                            // Обычный неверный код - сбрасываем с визуальной тряской
                            password = '';
                            slots.forEach(slot => {
                                slot.classList.remove('filled');
                                slot.textContent = '';
                            });
                            const dotsContainer = document.getElementById('password-dots');
                            dotsContainer.style.transform = 'translateX(-10px)';
                            setTimeout(() => dotsContainer.style.transform = 'translateX(10px)', 100);
                            setTimeout(() => dotsContainer.style.transform = 'translateX(-10px)', 200);
                            setTimeout(() => dotsContainer.style.transform = 'translateX(0)', 300);
                        }
                    }
                }, 500); // небольшая задержка перед проверкой, чтобы было видно 4-й кружок
            }
        }
    }

    // --- ЛОГИКА ОТОБРАЖЕНИЯ ВТОРОГО ЭКРАНА ---
    const lettersData = {
        "1": "Пам'ятаєш? Жовтень 2018. Ти прийшла з роботи — вид «я тут випадково». Але ти всміхнулась — і все. Я тоді ще не знав, що це назавжди. А виявилось — так.\n\nтвій Діма 🌸",
        "2": "Є люди, які входять у твоє життя — і ти відразу розумієш: ось воно. Ти саме така. Не ідеальна в кіношному сенсі — краща. Справжня. Тепла. Моя.\n\nкохаю 🌸",
        "3": "Скільки п'ятничних вечорів на дивані. Скільки «нікуди не йдемо». Скільки піц, серіалів, дурниць і сміху. Хотів би повторити кожен день. Навіть той з піцою що не вийшла.\n\nДи 🌸",
        "4": "Сьогодні — твій день. Але чесно? Кожен день з тобою — вже свято. Просто цього разу я написав це на папері. Або на екрані. Але серцем — точно на папері.\n\nз усією любов'ю 🌸"
    };

    // Показать второй экран (Листы + Игра) - вызывается после верного пароля или 3 ошибок
    function showScreenTwo() {
        const contentWrapper = document.querySelector('.content-wrapper');
        const screenTwo = document.getElementById('screen-two');

        // Плавно уводим первый экран вправо
        if (contentWrapper) {
            contentWrapper.classList.add('slide-out-right');
        }

        // Через задержку выводим второй экран слева
        if (screenTwo) {
            setTimeout(() => {
                screenTwo.classList.add('active');
                startGame(); // Автозапуск игры
            }, 400);
        }
    }

    // --- ЛОГИКА ИГРЫ "ВЛУЧИ В СЕРЦЕ" ---
    let gameScore = 0;
    let gameMisses = 0;
    const maxScore = 10;
    let gameInterval = null;
    let gameActive = false;
    const gameArea = document.getElementById('game-area');
    const scoreValue = document.getElementById('game-score-value');
    const attemptsValue = document.getElementById('game-attempts-value');
    const gameToast = document.getElementById('game-toast');
    const winModal = document.getElementById('game-win-modal');
    const restartBtn = document.getElementById('game-restart-btn');

    const ITEM_TYPES = [
        { emoji: '❤️', isHeart: true },
        { emoji: '💍', isHeart: false, message: 'я просив збирати серця! 😅' },
        { emoji: '💵', isHeart: false, message: 'ну ти як завжди 😊' },
        { emoji: '💐', isHeart: false, message: 'квіти це для тебе, а тут треба серця 🌸' }
    ];

    function showToast(message) {
        if (!gameToast) return;
        gameToast.textContent = message;
        gameToast.classList.add('visible');
        setTimeout(() => { gameToast.classList.remove('visible'); }, 2000);
    }

    function updateScoreDisplay() {
        if (scoreValue) scoreValue.textContent = `${Math.max(0, gameScore)} / ${maxScore}`;
        if (attemptsValue) attemptsValue.textContent = `${gameMisses} промахів`;
    }

    function createGameItem() {
        if (!gameActive || !gameArea) return;
        const item = document.createElement('div');
        item.classList.add('game-item');

        const isHeartSpawn = Math.random() < 0.4;
        let type;
        if (isHeartSpawn) {
            type = ITEM_TYPES[0];
        } else {
            type = ITEM_TYPES[Math.floor(Math.random() * (ITEM_TYPES.length - 1)) + 1];
        }

        item.textContent = type.emoji;
        const randomX = Math.random() * 80 + 10;
        item.style.left = `${randomX}%`;
        item.style.top = '-50px';

        const duration = Math.random() * 1.5 + 1.5;
        item.style.transition = `top ${duration}s linear`;

        gameArea.appendChild(item);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                item.style.top = '100%';
            });
        });

        item.addEventListener('click', () => {
            if (!gameActive || item.classList.contains('popped')) return;
            item.classList.add('popped');

            if (type.isHeart) {
                gameScore++;
                updateScoreDisplay();
                if (gameScore >= maxScore) endGame(true);
            } else {
                // Промах — минусуем очки
                gameMisses++;
                if (gameScore > 0) gameScore--;
                updateScoreDisplay();
                showToast(type.message);
            }

            setTimeout(() => { if (item.parentNode) item.parentNode.removeChild(item); }, 300);
        });

        setTimeout(() => {
            if (item.parentNode && !item.classList.contains('popped')) {
                item.parentNode.removeChild(item);
            }
        }, duration * 1000);
    }

    function startGame() {
        gameScore = 0;
        gameMisses = 0;
        stats.gamesPlayed++; // Трекаем старт игры
        updateScoreDisplay();
        if (gameArea) gameArea.innerHTML = '';
        if (winModal) winModal.classList.remove('active');
        gameActive = true;
        gameInterval = setInterval(createGameItem, 500);
    }

    function endGame(isWin) {
        gameActive = false;
        clearInterval(gameInterval);
        if (isWin) {
            stats.gameWins++; // Трекаем победу
            if (winModal) winModal.classList.add('active');
        }
    }



    // --- МОДАЛЬНЫЕ ОКНА ПИСЕМ ---
    const letterCards = document.querySelectorAll('.letter-card');
    const letterModal = document.getElementById('letter-modal');
    const letterTextBody = document.getElementById('letter-text-body');
    const closeModalBtn = document.getElementById('close-modal');

    if (letterCards && letterModal) {
        letterCards.forEach(card => {
            card.addEventListener('click', () => {
                const letterId = card.getAttribute('data-letter');
                stats.lettersOpened.add(letterId); // Трекаем письмо
                const text = lettersData[letterId];
                if (text) {
                    letterTextBody.textContent = text;
                    letterModal.classList.add('active');
                }
            });
        });

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                letterModal.classList.remove('active');
            });
        }

        letterModal.addEventListener('click', (e) => {
            if (e.target === letterModal) {
                letterModal.classList.remove('active');
            }
        });
    }

    // --- LOVE IS: Анимация карточек при прокрутке ---
    const loveCards = document.querySelectorAll('.loveis-card');
    const screenTwoEl = document.getElementById('screen-two');

    function checkLoveCards() {
        if (!screenTwoEl) return;
        const containerRect = screenTwoEl.getBoundingClientRect();

        loveCards.forEach((card, i) => {
            if (card.classList.contains('visible')) return;
            const cardRect = card.getBoundingClientRect();
            // Если карточка видна в контейнере
            if (cardRect.top < containerRect.bottom - 40) {
                setTimeout(() => {
                    card.classList.add('visible');
                }, i * 120);
            }
        });
    }

    if (screenTwoEl) {
        screenTwoEl.addEventListener('scroll', checkLoveCards);
        // Также проверяем при активации screen-two (через MutationObserver)
        const mo = new MutationObserver(() => {
            if (screenTwoEl.classList.contains('active')) {
                setTimeout(checkLoveCards, 600);
            }
        });
        mo.observe(screenTwoEl, { attributes: true, attributeFilter: ['class'] });
    }

    // Тап для мобильных — переворот карточки (с автозакрытием остальных)
    loveCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            const isFlippedNow = !card.classList.contains('flipped');
            
            if (isFlippedNow) {
                loveCards.forEach(c => {
                    if (c !== card) c.classList.remove('flipped');
                });
            }
            
            card.classList.toggle('flipped');
            if (card.classList.contains('flipped')) {
                stats.cardsFlipped.add(index + 1); // Трекаем перевернутую карточку (1-6)
            }
        });
    });

    // =================================================================
    //  МАГИЧЕСКИЙ ФИНАЛ — при прокрутке в самый низ (с паузой 8 сек)
    // =================================================================
    const overlay = document.getElementById('magic-overlay');
    const sparkCanvas = document.getElementById('spark-canvas');
    const countdown = document.getElementById('magic-countdown');
    const nameBlock = document.getElementById('magic-name-block');
    const nameEl = document.getElementById('magic-name');
    const phrasesEl = document.getElementById('magic-phrases');
    const cardEl = document.getElementById('magic-card');
    const cardPhrases = document.getElementById('magic-card-phrases');
    const saveBtn = document.getElementById('magic-save');
    const returnBtn = document.getElementById('magic-return');
    let magicTriggered = false;
    let bottomTimer = null;
    let sparkCtx = null;

    // Фразы
    const phrases = [
        'Мені дуже пощастило йти по життю поруч з тобою',
        'Люблю спостерігати, як ти перетворюєш звичайні дні на особливі',
        'Нехай тебе оточують люди, поруч з якими легко, і події, які хочеться запам\'ятати',
        'Я радий що того вечора ми зустрілися в маку і що земля виявилась круглою :)'
    ];

    // Позиции фраз (top%, left%)
    const phrasePositions = [
        { top: '8%', left: '5%', right: 'auto' }, // Верх слева
        { top: '85%', left: 'auto', right: '5%' }, // Низ справа
        { top: '25%', left: 'auto', right: '2%' }, // Чуть ниже верха справа
        { top: '70%', left: '2%', right: 'auto' } // Чуть выше низа слева
    ];

    // Триггер — прокрутка screen-two до конца + пауза 4 сек
    let hasFinaleStarted = false; // Глобальный флаг, чтобы не запускалось дважды

    if (screenTwoEl) {
        screenTwoEl.addEventListener('scroll', () => {
            if (magicTriggered || hasFinaleStarted) return;
            const scrollBottom = screenTwoEl.scrollTop + screenTwoEl.clientHeight;
            const totalHeight = screenTwoEl.scrollHeight;

            if (scrollBottom >= totalHeight - 30) {
                if (!bottomTimer) {
                    bottomTimer = setTimeout(() => {
                        magicTriggered = true;
                        hasFinaleStarted = true; // Запоминаем, что мы уже запустили финал
                        startMagicFinale();
                    }, 4000); // 4 секунды
                }
            } else {
                if (bottomTimer) { clearTimeout(bottomTimer); bottomTimer = null; }
            }
        });
    }

    function startMagicFinale() {
        if (!overlay) return;
        overlay.classList.add('active');
        setupSpark();
        setTimeout(() => runCountdown(), 500);
    }

    // --- Этап 1: Обратный отсчёт ---
    function runCountdown() {
        const steps = ['3', '2', '1', 'Весна!'];
        let i = 0;
        function show() {
            if (i >= steps.length) {
                countdown.classList.remove('visible');
                setTimeout(() => revealName(), 400);
                return;
            }
            
            countdown.textContent = steps[i];
            
            countdown.classList.add('visible');
            setTimeout(() => {
                countdown.classList.remove('visible');
                setTimeout(() => { i++; show(); }, 350);
            }, 700);
        }
        show();
    }

    // --- Этап 2: Имя «Кохане» ---
    function revealName() {
        if (!nameBlock) return;
        nameBlock.classList.add('visible');
        startNameSparks();
        setTimeout(() => showPhrases(), 2500);
    }

    // --- Искры из букв при hover ---
    function setupSpark() {
        if (!sparkCanvas) return;
        sparkCanvas.width = window.innerWidth;
        sparkCanvas.height = window.innerHeight;
        sparkCtx = sparkCanvas.getContext('2d');
    }

    function spawnSpark(x, y) {
        if (!sparkCtx) return;
        const colors = [
            'rgba(255, 215, 0, 0.8)',
            'rgba(255, 182, 193, 0.7)',
            'rgba(255, 255, 255, 0.9)',
            'rgba(255, 240, 200, 0.7)'
        ];
        for (let i = 0; i < 4; i++) {
            const size = 1.5 + Math.random() * 3;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const sx = x + (Math.random() - 0.5) * 30;
            const sy = y + (Math.random() - 0.5) * 30;
            sparkCtx.beginPath();
            sparkCtx.fillStyle = color;
            sparkCtx.arc(sx, sy, size, 0, Math.PI * 2);
            sparkCtx.fill();
            setTimeout(() => {
                sparkCtx.beginPath();
                sparkCtx.globalCompositeOperation = 'destination-out';
                sparkCtx.arc(sx, sy, size + 1, 0, Math.PI * 2);
                sparkCtx.fill();
                sparkCtx.globalCompositeOperation = 'source-over';
            }, 500 + Math.random() * 400);
        }
    }

    function startNameSparks() {
        if (!nameEl) return;
        nameEl.addEventListener('mousemove', (e) => {
            spawnSpark(e.clientX, e.clientY);
        });
        nameEl.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            spawnSpark(t.clientX, t.clientY);
        });
        // Также искры при движении по всему оверлею
        overlay.addEventListener('mousemove', (e) => {
            if (Math.random() < 0.3) spawnSpark(e.clientX, e.clientY);
        });
    }

    // --- Этап 3: Облако фраз ---
    function showPhrases() {
        if (!phrasesEl) return;
        phrasesEl.innerHTML = '';

        phrases.forEach((text, idx) => {
            const el = document.createElement('div');
            el.classList.add('magic-phrase');
            el.textContent = text;
            const pos = phrasePositions[idx];
            el.style.top = pos.top;
            if (pos.left) el.style.left = pos.left;
            if (pos.right) el.style.right = pos.right;
            phrasesEl.appendChild(el);

            // Появление с задержкой
            setTimeout(() => el.classList.add('visible'), 800 + idx * 1800);

            // Лёгкое уклонение от курсора
            overlay.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const push = (150 - dist) / 150 * 8;
                    el.style.transform = `translate(${-dx / dist * push}px, ${-dy / dist * push}px)`;
                } else {
                    el.style.transform = '';
                }
            });
        });

        // Через 10 секунд — собираем в открытку
        setTimeout(() => collectIntoCard(), 18000);
    }

    // --- Этап 5: Собираем всё в открытку ---
    function collectIntoCard() {
        // Скрываем имя и фразы
        if (nameBlock) {
            nameBlock.style.transition = 'opacity 1.5s ease, transform 1.5s ease';
            nameBlock.style.opacity = '0';
            nameBlock.style.transform = 'scale(0.7)';
        }
        const allPhrases = phrasesEl ? phrasesEl.querySelectorAll('.magic-phrase') : [];
        allPhrases.forEach(p => {
            p.style.transition = 'opacity 1s ease, transform 1s ease';
            p.style.opacity = '0';
            p.style.transform = 'scale(0.5)';
        });

        // Заполняем открытку фразами
        if (cardPhrases) {
            cardPhrases.innerHTML = phrases.map(p => `<div style="margin-bottom:8px;">✦ ${p}</div>`).join('');
        }

        setTimeout(() => {
            if (sparkCtx) sparkCtx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
            if (cardEl) cardEl.classList.add('visible');
        }, 1600);
    }

    // --- Кнопка «Сохранить» ---
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // Используем html2canvas-lite подход — просто скриншот карточки
            const cardInner = cardEl.querySelector('.magic-card-inner');
            if (cardInner) {
                // Создаём канвас и рисуем карточку текстом
                const c = document.createElement('canvas');
                c.width = 700; c.height = 500;
                const cx = c.getContext('2d');

                // Фон
                const grad = cx.createLinearGradient(0, 0, 700, 500);
                grad.addColorStop(0, '#fff5f8');
                grad.addColorStop(1, '#ffe8ee');
                cx.fillStyle = grad;
                cx.beginPath();
                cx.roundRect(0, 0, 700, 500, 30);
                cx.fill();

                // Имя
                cx.fillStyle = '#880e4f';
                cx.font = '600 48px "Cormorant Garamond", serif';
                cx.textAlign = 'center';
                cx.fillText('Кохане', 350, 70);

                // Фразы
                cx.fillStyle = '#ad1457';
                cx.font = '24px "Great Vibes", cursive';
                phrases.forEach((p, i) => {
                    cx.fillText('✦ ' + p, 350, 130 + i * 65);
                });

                // Подпись
                cx.fillStyle = '#c2185b';
                cx.font = '26px "Great Vibes", cursive';
                cx.fillText('з любов\'ю, Діма 🌸', 350, 430);

                // Скачать
                const link = document.createElement('a');
                link.download = 'kohane-8-bereznya.png';
                link.href = c.toDataURL('image/png');
                link.click();
            }
        });
    }

    // --- Кнопка «Вернуться» ---
    if (returnBtn) {
        returnBtn.addEventListener('click', closeMagic);
    }

    function closeMagic() {
        if (!overlay) return;
        overlay.classList.remove('active');
        setTimeout(() => {
            if (countdown) countdown.classList.remove('visible');
            if (nameBlock) { nameBlock.classList.remove('visible'); nameBlock.style.opacity = ''; nameBlock.style.transform = ''; }
            if (phrasesEl) phrasesEl.innerHTML = '';
            if (cardEl) cardEl.classList.remove('visible');
            if (sparkCtx) sparkCtx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
            magicTriggered = false;
        }, 1600);
    }
});

// =================================================================
//  Музыкальный плеер — Плейлист (с плавным запуском)
// =================================================================
(function () {
    const audio = document.getElementById('bg-music');
    const toggleBtn = document.getElementById('music-toggle');
    const nextBtn = document.getElementById('music-next');
    const volumeSlider = document.getElementById('music-volume');
    const musicDot = document.getElementById('music-dot');
    const musicTitle = document.getElementById('music-title');
    if (!audio) return;

    // Плейлист
    const playlist = [
        { src: 'muzic/tamada.mp3', title: 'Tamada — Miyagi' },
        { src: 'muzic/prijedu.mp3', title: 'Приеду — ХаммаАли' }
    ];
    let currentTrackIndex = 0;

    let targetVolume = 0.3;
    let fadeInterval;
    let autoplayTried = false;

    // Устанавливаем первый трек при загрузке
    audio.src = playlist[currentTrackIndex].src;
    if (musicTitle) musicTitle.textContent = playlist[currentTrackIndex].title;

    function updateUIPlay() {
        if (toggleBtn) toggleBtn.textContent = '⏸';
        if (musicDot) musicDot.classList.add('active');
    }

    function updateUIPause() {
        if (toggleBtn) toggleBtn.textContent = '🎵';
        if (musicDot) musicDot.classList.remove('active');
    }

    function loadAndPlayTrack(index, autostart = true) {
        currentTrackIndex = index;
        audio.src = playlist[currentTrackIndex].src;
        if (musicTitle) musicTitle.textContent = playlist[currentTrackIndex].title;

        if (autostart) {
            audio.volume = targetVolume;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => updateUIPlay()).catch(e => console.log(e));
            }
        }
    }

    function playNextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadAndPlayTrack(currentTrackIndex, !audio.paused); // Продолжаем играть, если до этого играло
    }

    function fadeInAudio() {
        if (!audio.paused && autoplayTried) return;
        autoplayTried = true;

        audio.volume = 0;
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Автоплей разрешен
                updateUIPlay();

                // Плавное нарастание громкости
                clearInterval(fadeInterval);
                fadeInterval = setInterval(() => {
                    if (audio.volume < targetVolume) {
                        audio.volume = Math.min(targetVolume, audio.volume + 0.05);
                    } else {
                        clearInterval(fadeInterval);
                    }
                }, 200); // Повышаем каждые 200мс (быстрее нарастает)
            }).catch(error => {
                console.log("Автозапуск заблокирован браузером. Ждём взаимодействия...", error);

                // Если браузер заблокировал запуск - стартуем при первом клике или скролле пользователя
                // Важно: снимаем обработчики СРАЗУ при первом срабатывании, чтобы не запускать музыку 100 раз
                const startOnInteraction = () => {
                    document.removeEventListener('click', startOnInteraction);
                    document.removeEventListener('touchstart', startOnInteraction);
                    document.removeEventListener('scroll', startOnInteraction);
                    
                    if (audio.paused) {
                        loadAndPlayTrack(currentTrackIndex, true);
                    }
                };

                document.addEventListener('click', startOnInteraction);
                document.addEventListener('touchstart', startOnInteraction);
                document.addEventListener('scroll', startOnInteraction);
            });
        }
    }

    // Запускаем сразу же при загрузке скрипта
    fadeInAudio();

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Предотвращаем срабатывание клика по документу
            if (audio.paused) {
                audio.volume = targetVolume;
                audio.play();
                updateUIPlay();
            } else {
                audio.pause();
                updateUIPause();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playNextTrack();
        });
    }

    // Авто-переключение трека, когда текущий заканчивается
    audio.addEventListener('ended', playNextTrack);

    if (volumeSlider) {
        volumeSlider.addEventListener('click', (e) => e.stopPropagation());
        volumeSlider.addEventListener('touchstart', (e) => e.stopPropagation());
        volumeSlider.addEventListener('input', (e) => {
            targetVolume = parseInt(e.target.value) / 100;
            audio.volume = targetVolume;
        });
    }
})();



