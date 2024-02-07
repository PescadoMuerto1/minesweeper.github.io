'use strict'

const MINE = '💣'
const EMPTY = ' '
const happySmile = '😃'
const sadSmile = '😤'
const winSmile = '😎'
const live = '🤍' 

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


function onInit(){
    gMinesIdx = []
    gIsFirstCLick = true
    gOpenCellsCount = 0
    gMarkedCount = 0
    gLives = 3
    handleLives()
    hideModal()
    gBoard = buildBoard()
    renderBoard(gBoard)
}

function onPlay(){
    setMines()
    setMinesNegsCount()
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
            strHtml += `<td onclick="onCellClicked(this,${i},${j},event)" oncontextmenu="onCellMark(this,${i},${j})" class="${className}"></td>`
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
        handleSmile(sadSmile)

        setTimeout(()=>{
            elCell.classList.remove('show')
            elCell.innerText = EMPTY
            handleSmile(happySmile)}, 1000)      
}

function onCellMark(elCell, i, j){
    const elBoard = document.querySelector('.board-container')

    elBoard.addEventListener('contextmenu', function(e) {
        e.preventDefault()
    }, false)

    if(gBoard[i][j].isShown) return
    if(gBoard[i][j].isMarked){
        gBoard[i][j].isMarked = false
        elCell.classList.remove('marked')
        gMarkedCount --
    }else{
        gBoard[i][j].isMarked = true
        elCell.classList.add('marked') 
        gMarkedCount ++
        checkGameOver()  
    }
}
function checkGameOver(){
    if(gOpenCellsCount === gLevel.SIZE **2 - gLevel.MINES
        && gLevel.MINES === gMarkedCount) gameOver(true)
}

function gameOver(isWin, i, j){
    var txt = 'won'
    if(!isWin){
       txt = 'lost'
    } 
    showModal(txt)
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

function handleSmile(smileType){
    const smile = document.querySelector('.smile').innerText = smileType
}     
   
function handleLives(){
    document.querySelector('.lives').innerText = live.repeat(gLives)
}

function handleHints(idx){
    const cellI = indexI
    const cellJ = indexJ
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (i === idx.i && j === idx.j) return 
            renderCell(i, j, gBoard[i][j].value, 'show')
        }   
        
    }
        const elHint = document.querySelector(`.hint-${gHints}`)
        elHint.classList.remove('hide')
}

function showModal(txt) {
    const elModal = document.querySelector('.modal')
    document.querySelector('.modal span').innerText = txt
    elModal.classList.remove('hide')
}

function hideModal() {
    const elModal = document.querySelector('.modal')
    elModal.classList.add('hide')
}