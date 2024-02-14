'use strict'

const MINE = '💣'
const EMPTY = ' '
const HAPPY_IMG = `<img src="img/happy-smile.png">`
const SAD_IMG = `<img src="img/sad-smile.png">`
const NORMAL_IMG = `<img src="img/smile.png">`
const live = '🖤 ' 

const MINE_IMG = '<img class"mine" src="img/mine.png">'

var gBoard
var gLevel = {
    SIZE: 4,
    MINES: 2
    }
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}    


var gMinesIdx = []
var gIsFirstCLick = true
var gFirstCellIdx
var gOpenCellsCount = 0
var gMarkedCount = 0
var gLives = 3
var gHints = 3
var gIsHInt = false
var gTimerInterval
var gSeconds


function onInit(){
    gMinesIdx = []
    gIsFirstCLick = true
    gOpenCellsCount = 0
    gMarkedCount = 0
    gLives = 3
    gTimerInterval = 0
    handleLives()
    hideModal('win')
    hideModal('lose')
    gBoard = buildBoard()
    renderBoard(gBoard)
    updateTopScore()
}

function onPlay(){
    setMines()
    setMinesNegsCount()
    startTimer()
    onAudio()
}

function buildBoard(){
    var board = []

    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([])

        for (var j = 0; j < gLevel.SIZE; j++) {
            // if (board[i][j] === MINE)
            board[i][j] = {
                value: EMPTY,
                isShown: false,
                isMine: false,
                isMarked: false
            }
             
        }
    }
    return board
}

function setMines(){
    const minesCount = gLevel.MINES

    for (let idx = 0; idx < minesCount; idx++) {
        const i = getRandomIntInclusive(0, gLevel.SIZE -1)
        const j = getRandomIntInclusive(0, gLevel.SIZE -1)
        if(gBoard[i][j].value === MINE){
            idx -- 
            continue
        }
        if(isInFirstCLick({i, j})){
            idx --
            continue
        } 
        gBoard[i][j].value = MINE
        gMinesIdx.push({i, j})
    }
}

function setMinesNegsCount(){
    for (let i = 0; i < gMinesIdx.length; i++) {
        const idx = gMinesIdx[i];
        countNeighbors(idx)
    }
}

function renderBoard(board){
    var strHtml = ''
    for (var i = 0; i < board.length; i++) {
        strHtml += '<tr>'
        for (var j = 0; j < board.length; j++) {
            const cell = board[i][j].value
            const className = `cell cell-${i}-${j}`
            strHtml += `<td onclick="onCellClicked(this,${i},${j},event)" oncontextmenu="onCellMark(this,${i},${j})" class="${className}">${EMPTY}</td>`
        }
        strHtml += '</tr>'
    }
    const elMat = document.querySelector('.board')
    elMat.innerHTML = strHtml
}

function onCellClicked(elCell, i, j){
    if(gBoard[i][j].isShown) return
    if(gBoard[i][j].isMarked) return
    if(gIsFirstCLick){
        gFirstCellIdx = {i:i, j:j}
        onPlay()
       
        gBoard[i][j].isShown = true
    }
    if(gIsHInt){
        handleHints()
    }
    if(gBoard[i][j].value === MINE){
        if (gLives === 1)gameOver(false, i, j)
        handleMineClicked(elCell)  
        return
    }
    if(gBoard[i][j].value === EMPTY) expandShown(i, j)
    const a = new Audio('sound/click.mp3')
    a.play
    gBoard[i][j].isShown = true
    elCell.classList.add('show')
    elCell.innerText = gBoard[i][j].value

    gIsFirstCLick = false
    gOpenCellsCount ++
    checkGameOver()
}

function handleMineClicked(elCell){
        elCell.classList.add('show')
        elCell.innerText = MINE
        gLives --
        handleLives()
        handleSmile(SAD_IMG)

        setTimeout(()=>{
            elCell.classList.remove('show')
            elCell.innerText = EMPTY
            handleSmile(NORMAL_IMG)}, 1000)      
}

function onCellMark(elCell, i, j){
    const elBoard = document.querySelector('.board-container')

    elBoard.addEventListener('contextmenu', function(e) {
        e.preventDefault()
    }, false)

    if(gBoard[i][j].isShown) return
    if(gBoard[i][j].isMarked){
        gBoard[i][j].isMarked = false
        elCell.innerText = ''
        elCell.classList.remove('marked')
        gMarkedCount --
    }else{
        gBoard[i][j].isMarked = true
        elCell.innerText = 'X'
        elCell.classList.add('marked') 
        gMarkedCount ++
        checkGameOver()  
    }
}
function checkGameOver(){
    if(gOpenCellsCount === gLevel.SIZE **2 - gLevel.MINES
        && gLevel.MINES === gMarkedCount) gameOver(true)
}

function gameOver(isWin){
    clearInterval(gTimerInterval)
    if(!isWin){
        showModal('lose')
    }else{
        checkTopScore(gLevel.SIZE / 4, gSeconds)
        showModal('win')
    } 
}

function isInFirstCLick(idx){
    const cellI = gFirstCellIdx.i
    const cellJ = gFirstCellIdx.j
    // var neighborsCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (i === idx.i && j === idx.j) return true
        }
        
    }
    return
}

function expandShown(indexI, indexJ){
    const cellI = indexI
    const cellJ = indexJ
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= gBoard[i].length) continue

            if (gBoard[i][j].value !== MINE 
                && gBoard[i][j].value !== EMPTY
                && !gBoard[i][j].isShown){
                    renderCell(i, j, gBoard[i][j].value, 'show')
                    gBoard[i][j].isShown = true
                } 
            if (gBoard[i][j].value === EMPTY && !gBoard[i][j].isShown ) {
                gBoard[i][j].isShown = true
                renderCell(i, j, gBoard[i][j].value, 'show')
                expandShown(i, j)   
            }
            
        }
        
    }
}

function renderCell(i, j, value, className){
    const elCell = document.querySelector(`.cell-${i}-${j}`)
    elCell.innerText = value
    elCell.classList.add(className)
    gOpenCellsCount ++
}

function onHintClick(elHint){
    if(gIsHInt) return
    elHint.style.backgroundColor = 'yellow'
    gIsHInt = true

}

function onGameLevel(elBtn, num, mines){
    if(!gTimerInterval){
        gLevel.SIZE = num   
        gLevel.MINES = mines   
        onInit()
    }
}

function startTimer() {

    if (gTimerInterval) clearInterval(gTimerInterval)

    var startTime = Date.now()
    gTimerInterval = setInterval(() => {
        const timeDiff = Date.now() - startTime

        gSeconds = getFormatSeconds(timeDiff)
        document.querySelector('.time').innerText =  gSeconds
    }, 10)
}

function getFormatSeconds(timeDiff) {
    const seconds = Math.floor(timeDiff / 1000)
    return (seconds + '').padStart(2, '0')
}


function handleSmile(smileType){
    const smile = document.querySelector('.smile').innerHTML = smileType
}     
   
function handleLives(){
    document.querySelector('.lives').innerText = live.repeat(gLives)
}

function checkTopScore(level,time){
    
    if(localStorage.getItem(level) > time){
        console.log(level, time)
        localStorage.setItem(level, time)
        updateTopScore()
    }    
}

function updateTopScore(){
    for (let i = 1; i < 4; i++) {
        if (!localStorage.getItem(i)) {
            localStorage.setItem(i,Infinity)
        }
        else{
            const el = document.querySelector(`.score-${i}`)
            el.innerText = `${localStorage.getItem(i)} Sec`
        }
    }    
}

// function handleHints(idx){
//     const cellI = indexI
//     const cellJ = indexJ
//     for (var i = cellI - 1; i <= cellI + 1; i++) {
//         if (i < 0 || i >= gBoard.length) continue
//         for (var j = cellJ - 1; j <= cellJ + 1; j++) {
//             if (j < 0 || j >= gBoard[i].length) continue
//             if (i === idx.i && j === idx.j) return 
//             renderCell(i, j, gBoard[i][j].value, 'show')
//         }   
        
//     }
//         const elHint = document.querySelector(`.hint-${gHints}`)
//         elHint.classList.remove('hide')
// }

function showModal(txt) {
    const elModal = document.querySelector(`.${txt}-modal-container`)
    document.querySelector(`.board`).classList.add('hide')
    elModal.classList.remove('hide')
}

function hideModal(txt) {
    const elModal = document.querySelector(`.${txt}-modal-container`)
    document.querySelector(`.board`).classList.remove('hide')
    elModal.classList.add('hide')
}

const audioEl = new Audio('sound/videoplayback (1).mp3')
function onAudio(){
    audioEl.volume = 0.3
    audioEl.play()
}
