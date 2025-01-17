// получаем доступ к холсту
const canvas = document.getElementById('field');
const context = canvas.getContext('2d');

//sounds
const placeSound = document.getElementById('placeSound');
const winSound = document.getElementById('winSound');
const loseSound = document.getElementById('loseSound');
// размер квадратика
const grid = 40;
// массив с последовательностями фигур, на старте — пустой
let tetrominoSequence = [];

// с помощью двумерного массива следим за тем, что находится в каждой клетке игрового поля
// размер поля — 10 на 20, и несколько строк ещё находится за видимой областью
let playfield = [];

let isPaused = false;

// заполняем сразу массив пустыми ячейками
for (let row = -2; row < 20; row++) {
    playfield[row] = [];

    for (let col = 0; col < 10; col++) {
        playfield[row][col] = 0;
    }
}

let score = 0;
let goal = 0;
let linesDestroyed = 0;

// Функция для обновления значений на странице
function updateScoreDisplay() {
    document.getElementById('score').innerText = score;
    document.getElementById('linesDestroyed').innerText = linesDestroyed;
}

// Пример обновления значений (вызывайте эту функцию, когда нужно обновить счет и линии)
function increaseScore() {
    score += 1;
    updateScoreDisplay();
    if (score >= goal) {
        document.getElementById('win-window').style.display = 'block';
        // прекращаем всю анимацию игры
        cancelAnimationFrame(rAF);
        // ставим флаг окончания
        gameOver = true;
        winSound.currentTime = 0; // Перематываем звук на начало
        winSound.play();
    }
}

function increaseLinesDestroyed() {
    linesDestroyed += 1;
    updateScoreDisplay();
}

function startGame() {
    document.getElementById('start-window').style.display = 'none';
    goal = 10000000;
    document.getElementById('blocks').style.display = 'block';
    document.getElementById('field').style.display = 'block';
    document.getElementById('nextFigure').style.display = 'block';
    // старт игры
    rAF = requestAnimationFrame(loop);
}

function startWithGoal(){
    document.getElementById('start-window').style.display = 'none';
    goal = document.getElementById('userGoal').value;
    document.getElementById('blocks').style.display = 'block';
    document.getElementById('field').style.display = 'block';
    document.getElementById('nextFigure').style.display = 'block';
    // старт игры
    rAF = requestAnimationFrame(loop);
}

// задаём формы для каждой фигуры
const tetrominos = {
    'I': [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    'J': [
        [1,0,0],
        [1,1,1],
        [0,0,0],
    ],
    'L': [
        [0,0,1],
        [1,1,1],
        [0,0,0],
    ],
    'O': [
        [1,1],
        [1,1],
    ],
    'S': [
        [0,1,1],
        [1,1,0],
        [0,0,0],
    ],
    'Z': [
        [1,1,0],
        [0,1,1],
        [0,0,0],
    ],
    'T': [
        [0,1,0],
        [1,1,1],
        [0,0,0],
    ]
};

// цвет каждой фигуры
const colors = {
    'I': '#552CB8',
    'O': '#FFDE67',
    'T': '#FF8A00',
    'S': '#FC7DA8',
    'Z': '#E70000',
    'J': '#009A5E',
    'L': '#048CD6'
};

// счётчик
let count = 0;
// текущая фигура в игре
let tetromino = getNextTetromino();
//следующая фигура
let nextTetromino = getNextTetromino();
drawTetromino(nextTetromino);
// следим за кадрами анимации, чтобы если что — остановить игру
let rAF = null;
// флаг конца игры, на старте — неактивный
let gameOver = false;

// Функция возвращает случайное число в заданном диапазоне
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// создаём последовательность фигур, которая появится в игре
function generateSequence() {
    // тут — сами фигуры
    const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

    while (sequence.length) {
        // случайным образом находим любую из них
        const rand = getRandomInt(0, sequence.length - 1);
        const name = sequence.splice(rand, 1)[0];
        // помещаем выбранную фигуру в игровой массив с последовательностями
        tetrominoSequence.push(name);
    }
}

// получаем следующую фигуру
// Предполагаем, что у вас уже есть определенные tetrominos и tetrominoSequence

function getNextTetromino() {
    // если следующей нет — генерируем
    if (tetrominoSequence.length === 0) {
        generateSequence();
    }

    // берём первую фигуру из массива
    const name = tetrominoSequence.pop();
    const matrix = tetrominos[name];

    // I и O стартуют с середины, остальные — чуть левее
    const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

    // I начинает с 21 строки (смещение -1), а все остальные — со строки 22 (смещение -2)
    const row = name === 'I' ? -1 : -2;

    // Возвращаем объект с данными о тетромино
    return {
        name: name,      // название фигуры (L, O, и т.д.)
        matrix: matrix,  // матрица с фигурой
        row: row,        // текущая строка (фигуры стартуют за видимой областью холста)
        col: col         // текущий столбец
    };
}

function drawTetromino(tetromino) {

    const canvas = document.getElementById('nextFigure');
    const context = canvas.getContext('2d');

    // Извлекаем данные о тетромино
    const { name, matrix } = tetromino;

    // Определяем размеры фигуры
    const tetrominoWidth = matrix[0].length; // Количество колонок в матрице
    const tetrominoHeight = matrix.length; // Количество строк в матрице

    // Вычисляем координаты для центрирования
    const startX = (canvas.width - (tetrominoWidth * grid)) / 2;
    const startY = (canvas.height - (tetrominoHeight * grid)) / 2;

    // Очищаем канвас перед рисованием
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем основную фигуру
    for (let r = 0; r < tetrominoHeight; r++) {
        for (let c = 0; c < tetrominoWidth; c++) {
            if (matrix[r][c]) { // Если есть часть фигуры
                context.fillStyle = colors[name];
                context.fillRect(startX + c * grid, startY + r * grid, grid - 1, grid - 1);

                // Уровень прозрачности
                let alpha = 0.3; // Уровень прозрачности от 0 (прозрачный) до 1 (непрозрачный)
                context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                context.fillRect(startX + c * grid + 5, startY + r * grid + 5, (grid - 1) * 0.75, (grid - 1) * 0.75);
                context.strokeStyle = 'white';
                context.strokeRect(startX + c * grid + 5, startY + r * grid + 5, (grid - 1) * 0.75, (grid - 1) * 0.75);

                // Рисуем линии между уголками
                context.lineWidth = 1; // Ширина линий
                context.strokeStyle = 'white';
                context.beginPath();
                context.moveTo(startX + c * grid, startY + r * grid);
                context.lineTo(startX + c * grid + 5, startY + r * grid + 5);
                context.moveTo(startX + c * grid + 39, startY + r * grid);
                context.lineTo(startX + c * grid + 34, startY + r * grid + 5);
                context.moveTo(startX + c * grid, startY + r * grid + 39);
                context.lineTo(startX + c * grid + 5, startY + r * grid + 34);
                context.moveTo(startX + c * grid + 39, startY + r * grid + 39);
                context.lineTo(startX + c * grid + 34, startY + r * grid + 34);
                context.stroke();
            }
        }
    }
}


// поворачиваем матрицу на 90 градусов
function rotate(matrix) {
    const N = matrix.length - 1;
    let result;
    result = matrix.map((row, i) =>
        row.map((val, j) => matrix[N - j][i])
    );
    // на входе матрица, и на выходе тоже отдаём матрицу
    return result;
}

// проверяем после появления или вращения, может ли матрица (фигура) быть в этом месте поля или она вылезет за его границы
function isValidMove(matrix, cellRow, cellCol) {
    // проверяем все строки и столбцы
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] && (
                // если выходит за границы поля…
                cellCol + col < 0 ||
                cellCol + col >= playfield[0].length ||
                cellRow + row >= playfield.length ||
                // …или пересекается с другими фигурами
                playfield[cellRow + row][cellCol + col])
            ) {
                // то возвращаем, что нет, так не пойдёт
                return false;
            }
        }
    }
    // а если мы дошли до этого момента и не закончили раньше — то всё в порядке
    return true;
}

// когда фигура окончательна встала на своё место
function placeTetromino() {
    // обрабатываем все строки и столбцы в игровом поле
    for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col]) {
                // если край фигуры после установки вылезает за границы поля, то игра закончилась
                if (tetromino.row + row < 0) {
                    // прекращаем всю анимацию игры
                    cancelAnimationFrame(rAF);
                    // ставим флаг окончания
                    gameOver = true;
                    document.getElementById('lose-window').style.display = 'block';
                    loseSound.currentTime = 3; // Перематываем звук на начало
                    loseSound.play();
                }
                // если всё в порядке, то записываем в массив игрового поля нашу фигуру
                playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
                increaseScore();
                placeSound.currentTime = 0; // Перематываем звук на начало
                placeSound.play();
            }
        }
    }
    // получаем следующую фигуру
    tetromino = nextTetromino; // Изменяем текущую фигуру на следующую
    nextTetromino = getNextTetromino(); // Получаем новую следующую фигуру
    drawTetromino(nextTetromino); // Отрисовываем следующую фигуру
    // проверяем, чтобы заполненные ряды очистились снизу вверх
    for (let row = playfield.length - 1; row >= 0; ) {
        // если ряд заполнен
        if (playfield[row].every(cell => !!cell)) {
            increaseLinesDestroyed();
            // очищаем его и опускаем всё вниз на одну клетку
            for (let r = row; r >= 0; r--) {
                for (let c = 0; c < playfield[r].length; c++) {
                    playfield[r][c] = playfield[r-1][c];
                }
            }
        } else {
            // переходим к следующему ряду
            row--;
        }
    }
}

// следим за нажатиями на клавиши
document.addEventListener('keydown', function(e) {
    // если игра закончилась — сразу выходим
    if (gameOver) return;

    // стрелки влево и вправо
    if (e.which === 37 || e.which=== 39) {
        const col = e.which === 37
            // если влево, то уменьшаем индекс в столбце, если вправо — увеличиваем
            ? tetromino.col - 1
            : tetromino.col + 1;

        // если так ходить можно, то запоминаем текущее положение
        if (isValidMove(tetromino.matrix, tetromino.row, col)) {
            tetromino.col = col;
        }
    }

    // стрелка вверх — поворот
    if (e.which === 38) {
        // поворачиваем фигуру на 90 градусов
        const matrix = rotate(tetromino.matrix);
        // если так ходить можно — запоминаем
        if (isValidMove(matrix, tetromino.row, tetromino.col)) {
            tetromino.matrix = matrix;
        }
    }

    // стрелка вниз — ускорить падение
    if(e.which === 40) {
        // смещаем фигуру на строку вниз
        const row = tetromino.row + 1;
        // если опускаться больше некуда — запоминаем новое положение
        if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
            tetromino.row = row - 1;
            // ставим на место и смотрим на заполненные ряды
            placeTetromino();
            return;
        }
        // запоминаем строку, куда стала фигура
        tetromino.row = row;
    }

    // пробел - пауза
    if (e.which === 32) {
        if (isPaused) {
            // Если игра на паузе, возобновляем
            isPaused = false; // Устанавливаем состояние игры
            rAF = requestAnimationFrame(loop); // Запускаем игровой цикл
            document.getElementById('pause-window').style.display = 'none'; // Убираем сообщение о паузе
        } else {
            // Если игра не на паузе, ставим на паузу
            cancelAnimationFrame(rAF);
            isPaused = true; // Устанавливаем состояние паузы
            document.getElementById('pause-window').style.display = 'block';// Отображаем сообщение о паузе
        }
    }
});

// главный цикл игры
function loop() {
    // начинаем анимацию
    rAF = requestAnimationFrame(loop);
    // очищаем холст
    context.clearRect(0,0,canvas.width,canvas.height);

    // рисуем игровое поле с учётом заполненных фигур
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            if (playfield[row][col]) {
                const name = playfield[row][col];
                context.fillStyle = colors[name];

                // рисуем всё на один пиксель меньше, чтобы получился эффект «в клетку»
                context.fillRect(col * grid, row * grid, grid-1, grid-1);
                let alpha = 0.3; // Уровень прозрачности от 0 (прозрачный) до 1 (непрозрачный)
                context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                context.fillRect(col * grid + 5, row * grid + 5, (grid-1)*0.75, (grid-1)*0.75);
                context.strokeRect(col * grid + 5, row * grid + 5, (grid-1)*0.75, (grid-1)*0.75);
                context.lineWidth = 1; // Ширина линий
                context.strokeStyle = 'white';
                context.beginPath();
                context.moveTo(col * grid,row * grid);
                context.lineTo(col * grid + 5,row * grid + 5);
                context.moveTo(col * grid + 39,row * grid);
                context.lineTo(col * grid + 34,row * grid + 5);
                context.moveTo(col * grid,row * grid + 39);
                context.lineTo(col * grid + 5,row * grid + 34);
                context.moveTo(col * grid + 39,row * grid + 39);
                context.lineTo(col * grid + 34,row * grid + 34);
                context.stroke();
            }
        }
    }

    // рисуем текущую фигуру
    if (tetromino) {

        // фигура сдвигается вниз каждые 35 кадров
        if (++count > 35) {
            tetromino.row++;
            count = 0;

            // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
            if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                tetromino.row--;
                placeTetromino();
            }
        }

        // отрисовываем её
        for (let row = 0; row < tetromino.matrix.length; row++) {
            for (let col = 0; col < tetromino.matrix[row].length; col++) {
                if (tetromino.matrix[row][col]) {
                    // и снова рисуем на один пиксель меньше
                    context.fillStyle = colors[tetromino.name];
                    context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1);
                    let alpha = 0.3; // Уровень прозрачности от 0 (прозрачный) до 1 (непрозрачный)
                    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    context.fillRect((tetromino.col + col) * grid + 5, (tetromino.row + row) * grid + 5, (grid-1)*0.75, (grid-1)*0.75);
                    context.strokeStyle = 'white';
                    context.strokeRect((tetromino.col + col) * grid + 5, (tetromino.row + row) * grid + 5, (grid-1)*0.75, (grid-1)*0.75);

// Рисуем линии между уголками

                    context.lineWidth = 1; // Ширина линий
                    context.strokeStyle = 'white';
                    context.beginPath();
                    context.moveTo((tetromino.col + col) * grid,(tetromino.row + row) * grid);
                    context.lineTo((tetromino.col + col) * grid + 5,(tetromino.row + row) * grid + 5);
                    context.moveTo((tetromino.col + col) * grid + 39,(tetromino.row + row) * grid);
                    context.lineTo((tetromino.col + col) * grid + 34,(tetromino.row + row) * grid + 5);
                    context.moveTo((tetromino.col + col) * grid,(tetromino.row + row) * grid + 39);
                    context.lineTo((tetromino.col + col) * grid + 5,(tetromino.row + row) * grid + 34);
                    context.moveTo((tetromino.col + col) * grid + 39,(tetromino.row + row) * grid + 39);
                    context.lineTo((tetromino.col + col) * grid + 34,(tetromino.row + row) * grid + 34);
                    context.stroke();
                }
            }
        }
    }
}


