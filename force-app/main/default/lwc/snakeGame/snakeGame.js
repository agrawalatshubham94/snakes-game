import { LightningElement, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import FORM_FACTOR from '@salesforce/client/formFactor';

let width = 10;
let height = 10;
let direction = 'E';
let level = [
    {name:'Level 1', speed:300, baseScore:100, foodCount:3},
    {name:'Level 2', speed:200, baseScore:200, foodCount:5}, 
    {name:'Level 3', speed:100, baseScore:300, foodCount:8}, 
    {name:'Level 4', speed:75, baseScore:450, foodCount:5}
];
let currentfoodCount = 0;
let foodPositionX;
let foodPositionY;
let foodAvailable = false;
let snake = [{x:20, y:0}, {x:10, y:0}, {x:0, y:0}];

export default class SnakeGame extends LightningElement {
    GAME_CANVAS;
    CTX;
    GAME;
    @track currentLevel = 1;
    @track score = 0;
    startTime;
    startOrPause = 'Pause';
    hasRendered = false;
    isGameOver = false;
    isSubmitted = false;
    showModal = true;
    showSpinner = false;
    
    get showControls() {
        return FORM_FACTOR != 'Large';
    }

    renderedCallback() { 
        if(!this.hasRendered) { 
            this.hasRendered = true;    
            let self = this;

            this.setCanvasProperties();

            document.onkeydown = function(event) { self.setSnakeDirection(event.keyCode); }
        }
    }

    handlePauseOrStart() {
        if (this.startOrPause == 'Start') {
            this.startOrPause = 'Pause';
            this.handleRestart();
        } else if (this.startOrPause == 'Resume'){
            this.startOrPause = 'Pause';
            this.startGame();
        } else {
            this.startOrPause = 'Resume';
            this.pauseGame();
        }
    }

    handleRestart() {
        this.showModal = false;
        this.showSpinner = false;
        this.isSubmitted = false;
        this.startOrPause = 'Pause';
        clearInterval(this.GAME); 
        this.score = 0;
        this.currentLevel = 1;
        direction = 'E';
        currentfoodCount = 0;
        foodAvailable = false;
        this.isGameOver = false;
        this.template.querySelector('.game-container').style.border = '20px solid black'; 
        snake = [{x:20, y:0}, {x:10, y:0}, {x:0, y:0}];
        
        this.startGame();
    }

    startGame() {
        let self = this;
        this.GAME = setInterval(function() { 
            self.clearCanvas();
            self.moveSnake();
            self.dropSnakeFood();             
        }, level[this.currentLevel-1].speed);
    }

    pauseGame() {
        clearInterval(this.GAME);
    }

    hanleSnakMove(event) {
        switch (event.target.title) {
            case 'Move Up': {
                this.setSnakeDirection('38');
                break;
            }
            case 'Move Left': {
                this.setSnakeDirection('37');
                break;
            }
            case 'Move Right': {
                this.setSnakeDirection('39');
                break;
            }
            case 'Move Down': {
                this.setSnakeDirection('40');
                break;
            }
            default:
                break;
        }
    }

    setCanvasProperties() {
        let containerDiv = this.template.querySelector('.game-container');
        let containerDivStyle = window.getComputedStyle(containerDiv);

        this.GAME_CANVAS = this.template.querySelector("canvas");
        this.CTX = this.GAME_CANVAS.getContext('2d');
        this.GAME_CANVAS.width = (containerDivStyle.width).substring(0, (containerDivStyle.width).length-2) - 40;
        this.GAME_CANVAS.height = (containerDivStyle.height).substring(0, (containerDivStyle.height).length-2) - 40;
    }

    clearCanvas() {
        this.CTX.clearRect(0, 0, this.GAME_CANVAS.width, this.GAME_CANVAS.height); 
    }

    dropSnakeFood() {
        if (!foodAvailable) {
            this.startTime = new Date();
            foodPositionX = Math.ceil((Math.random()*(this.GAME_CANVAS.width/10)))*width;
            foodPositionY = Math.ceil(Math.random()*(this.GAME_CANVAS.height/10))*height;
        }        
    
        if (snake.filter(pos => { return (pos.x == foodPositionX && pos.y == foodPositionY); }).length > 0 ||
            foodPositionX < 0 || foodPositionX > this.GAME_CANVAS.width-1 || foodPositionY < 0 || foodPositionY > this.GAME_CANVAS.height-1) {
            this.dropSnakeFood();
        } else {
            this.CTX.fillStyle = "#ffb3b3";
            this.CTX.strokeStyle = "#b30000";
            this.CTX.fillRect(foodPositionX, foodPositionY, width-1, height-1);
            this.CTX.strokeRect(foodPositionX, foodPositionY, width-1, height-1);
            foodAvailable = true; 
        }
    }

    handleScoreSubmit(event) {
        
        let player = this.template.querySelector('input[name="player-name"]').value;
        if(player) {
            event.preventDefault();
            this.showSpinner = true;
            const fields = {};
            fields['Score__c'] = this.score;
            fields['CreatedByGuestUser__c'] = true;
            fields['Player_Name__c'] = this.template.querySelector('input[name="player-name"]').value;
            const recordInput = { apiName: 'Score__c', fields };
            createRecord(recordInput).then(res => {
                this.isSubmitted = true;
                this.showSpinner = false;
            }).catch(err => {
                console.error(err);
            });
        }        
    }

    eatSnakeFood() {
        let self = this;    
        currentfoodCount++;
        snake.push({x:foodPositionX, y:foodPositionY});
        foodAvailable = false;
        let endTime = new Date();
        this.score += Math.round(level[this.currentLevel-1].baseScore/((endTime - this.startTime)/1000));
        if(this.currentLevel < 4 && currentfoodCount == level[this.currentLevel-1].foodCount) {
            clearInterval(this.GAME);            
            currentfoodCount = 0;
            this.currentLevel++;
            this.startGame();
        } else if (this.currentLevel == 4 && currentfoodCount == level[this.currentLevel-1].foodCount){
            this.CTX.font = "50px Georgia";
            this.CTX.fillStyle = "green"
            this.CTX.fillText("YOU WON!", (this.GAME_CANVAS.width/2)-130, this.GAME_CANVAS.height/2); 
            clearInterval(this.GAME); 
            setTimeout(() => {
                self.isGameOver = true;
            },1000); 
        }
    }

    setSnakeDirection(keyCode) {
        if (keyCode == '37') {
            if (direction != 'W' && direction != 'E') direction = 'W';
        }
        else if (keyCode == '38') {
            if (direction != 'N' && direction != 'S') direction = 'N';
        }
        else if (keyCode == '39') {
            if (direction != 'W' && direction != 'E') direction = 'E';
        }
        else if (keyCode == '40') {
            if (direction != 'N' && direction != 'S') direction = 'S';
        }
    }

    snakePosition(snakeHead) {
        let self = this;
        if (snakeHead.x < 0 || snakeHead.x > this.GAME_CANVAS.width-1 || snakeHead.y < 0 || snakeHead.y > this.GAME_CANVAS.height-1 ||
            snake.filter(pos => { return (pos.x == snakeHead.x && pos.y == snakeHead.y); }).length > 0) {
            clearInterval(this.GAME);
            this.template.querySelector('.game-container').style.border = '20px solid red'; 
            this.CTX.font = "50px Georgia";
            this.CTX.fillStyle = "red"
            this.CTX.fillText("Game Over!", (this.GAME_CANVAS.width/2)-130, this.GAME_CANVAS.height/2);  
            setTimeout(() => {
                self.isGameOver = true;
            },1000);    
        }
    }

    moveSnake() { 
        let snakeHead = snake[0];
        let snakeNewHead = {};
        switch (direction) {
            case 'E': {
                snakeNewHead.x = snakeHead.x + width;
                snakeNewHead.y = snakeHead.y;
                break;
            }
            case 'W': {
                snakeNewHead.x = snakeHead.x - width;
                snakeNewHead.y = snakeHead.y;            
                break;
            }
            case 'N': {
                snakeNewHead.x = snakeHead.x;
                snakeNewHead.y = snakeHead.y - width; 
                break;
            }
            case 'S': {
                snakeNewHead.x = snakeHead.x;
                snakeNewHead.y = snakeHead.y + width; 
                break;
            }
            default:
                break;
        }
    
        this.snakePosition(snakeNewHead);
    
        snake.unshift(snakeNewHead);
        snake.pop();   
        snake.forEach(pos => {
            this.CTX.fillStyle = "#80b3ff";
            this.CTX.strokeStyle = "#003380";
            this.CTX.fillRect(pos.x, pos.y, width, height);
            this.CTX.strokeRect(pos.x, pos.y, width-1, height-1);
        });
        
        if(snakeNewHead.x == foodPositionX && snakeNewHead.y == foodPositionY) {
            this.eatSnakeFood();
        }      
    }
    
}