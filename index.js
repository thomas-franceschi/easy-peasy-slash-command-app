//Tic Tac Toe Game
//Thomas Franceschi
//10/12/16

"use strict";

//Initialize global variables
var Botkit      = require('botkit');
var board       = [ '1', '2', '3', '4', '5', '6', '7', '8', '9']; //initialize empty board
var isTaken     = [ 0,0,0,0,0,0,0,0,0]; //keep track of which squares have been filled
var playerTurn  = 0; //keeps track of which player's move it is'
var inProgress  = 0; //1 if there is a game in progress
var players     = []; //keep track of player ids
var opponent;

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.PORT || !process.env.VERIFICATION_TOKEN) {
    console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN and PORT in environment');
    process.exit(1);
}

var config = {}
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: './db_slackbutton_slash_command/',
    };
}

var controller = Botkit.slackbot(config).configureSlackApp(
    {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        scopes: ['commands'],
    }
);

controller.setupWebserver(process.env.PORT, function (err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});


controller.on('slash_command', function (slashCommand, message) {

    switch (message.command) {
        //check for proper slash command
        case "/ttt":

            if (message.token !== process.env.VERIFICATION_TOKEN) return; //just ignore it.

            var sender = "<@" + message.user + ">";

            // if no text was supplied, treat it as a help command
            if (message.text === "" || message.text === "help") {
                slashCommand.replyPrivate(message, "Play a game of tic-tac-toe!\nControls:\n" +
                "@player - challenge player to game\n" + 
                "show board - display current game board\n" + 
                "'*1-9*' - select spot to place 'x' or 'o' (numbered from top left)\n");
                break;
            }

            if ( inProgress == 0 ) opponent = message.text;
            
            //if no game then start a new one
            if ( opponent.substring(0, 1) == "@" && inProgress == 0){
                players[0] = sender;
                players[1] = "<" + opponent + ">";
                slashCommand.replyPublic(message, "Player 1: " + players[0] + "\nPlayer 2: " + players[1]);
                inProgress = 1;
                break;
            }

            //quit current game
            if (message.text == "quit") {
                cleanUp();
                slashCommand.replyPublic(message, "Game Over");
            }
            
            //show board
            if (message.text == "show board" && inProgress == 1) {
                printBoard();
                break;
            }

            //if input is a number from 1-9 place marker on that space
            if (message.text >= '1' && message.text <= '9') {
                //check if player's turn
                if (playerTurn == 0 && sender != players[0]){
                    slashCommand.replyPrivate(message, "it's not your turn, " + sender + ", its " + players[0] + "'s !");
                    break;
                }
                else if (playerTurn == 1 && sender != players[1]){
                    slashCommand.replyPrivate(message, "it's not your turn, " + sender + ", its " + players[1] + "'s !");
                    break;
                }

                //convert input from string to int type
                var spot = parseInt(message.text) - 1;
                //slashCommand.replyPublic(message, spot);

                //check if spot is used already
                if ( isTaken[spot] == 1){
                    slashCommand.replyPublicDelayed(message,"spot is taken, try again <@" + message.user +">");
                    break;
                }
                //place marker
                if (playerTurn == 0){
                    board[spot] = 'X';
                    //check for win
                    isWin();
                    isTaken[spot] = 1;
                    playerTurn = 1;
                }
                else {
                    board[spot] = 'O'
                    //check for win
                    isWin();
                    isTaken[spot] = 1;
                    playerTurn = 0;
                }
                
                //print board
                printBoard();
                break;
            }
            
            // If we made it here, just echo what the user typed back at them
            else slashCommand.replyPrivate( message, message.text );

            break;
        default:
            slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }

    function printBoard(){
        slashCommand.replyPublicDelayed(message, "```" + board[0] + "|" + board[1] + "|" + board[2] + 
                                                         "\n_ _ _\n" +
                                                         board[3] + "|" + board[4] + "|" + board[5] +
                                                         "\n_ _ _\n" + 
                                                         board[6] + "|" + board[7] + "|" + board[8] + 
                                                         "```");
        slashCommand.replyPublicDelayed(message, "It is " + players[playerTurn] + " turn." );
    }

    function isWin(){
        //check horizontal
        for (var i = 0; i < 3; i++){
            if (board[ 1 + ( 3 * i ) ] == board[ 2 + ( 3 * i )] && board[ 2 + ( 3 * i )] == board[ 3 + ( 3 * i )]){
                slashCommand.replyPublic(message, players[playerTurn] + "has won!");
                cleanUp();
            }
        }
        //check vertical
        for (var i = 0; i < 3; i++){
            if (board[ 1 + i ] == board[ 4 + i ] && board[ 4 + i ] == board[ 7 + i ]){
                slashCommand.replyPublic(message, players[playerTurn] + " has won!");
                cleanUp();
            }
        }
        //check diagonal
        if ( board[1] == board[5] && board[5] == board[9] ){
            slashCommand.replyPublic(message, players[playerTurn] + " has won!");
            cleanUp();
        }
        if ( board[3] == board[5] && board[5] == board[7] ){
            slashCommand.replyPublic(message, players[playerTurn] + " has won!");
            cleanUp();
        }
    }

    function cleanUp(){
        //reset variables
        board       = [ '1', '2', '3', '4', '5', '6', '7', '8', '9']; //initialize empty board
        isTaken     = [0,0,0,0,0,0,0,0,0]; //keep track of which squares have been filled
        playerTurn  = 0; //keeps track of which player's move it is'
        inProgress  = 0; //1 if there is a game in progress
        players     = []; //keep track of player ids
    }

})
;
