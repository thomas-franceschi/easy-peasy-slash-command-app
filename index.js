/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ______    ______    ______   __  __    __    ______
 /\  == \  /\  __ \  /\__  _\ /\ \/ /   /\ \  /\__  _\
 \ \  __<  \ \ \/\ \ \/_/\ \/ \ \  _"-. \ \ \ \/_/\ \/
 \ \_____\ \ \_____\   \ \_\  \ \_\ \_\ \ \_\   \ \_\
 \/_____/  \/_____/    \/_/   \/_/\/_/  \/_/    \/_/


 This is a sample Slack Button application that provides a custom
 Slash command.

 This bot demonstrates many of the core features of Botkit:

 *
 * Authenticate users with Slack using OAuth
 * Receive messages using the slash_command event
 * Reply to Slash command both publicly and privately

 # RUN THE BOT:

 Create a Slack app. Make sure to configure at least one Slash command!

 -> https://api.slack.com/applications/new

 Run your bot from the command line:

 clientId=<my client id> clientSecret=<my client secret> PORT=3000 node bot.js

 Note: you can test your oauth authentication locally, but to use Slash commands
 in Slack, the app must be hosted at a publicly reachable IP or host.


 # EXTEND THE BOT:

 Botkit is has many features for building cool and useful bots!

 Read all about it here:
https://tictactoe.localtunnel.me/login
 -> http://howdy.ai/botkit

 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('botkit');
var board = [ '-', '-', '-', '-', '-', '-', '-', '-', '-']; //initialize empty board
var playerTurn = 0; //keeps track of which player's move it is'
var inProgress = 0; //1 if there is a game in progress

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


//
// BEGIN EDITING HERE!
//



controller.on('slash_command', function (slashCommand, message) {

    switch (message.command) {
        case "/ttt":

            if (message.token !== process.env.VERIFICATION_TOKEN) return; //just ignore it.

            // if no text was supplied, treat it as a help command
            if (message.text === "" || message.text === "help") {
                slashCommand.replyPrivate(message, "Play a game of tic-tac-toe!\nControls:\n" +
                "@player - challenge player to game\n" + 
                "show board - display current game board\n" + 
                "'*1-9*' - select spot to place 'x' or 'o' (numbered from top left)\n");
                return;
            }

            if (message.text == "show board") {
                slashCommand.replyPublicDelayed(message, "```" + board[0] + "|" + board[1] + "|" + board[2] + 
                                                         "\n_ _ _\n" +
                                                         board[3] + "|" + board[4] + "|" + board[5] +
                                                         "\n_ _ _\n" + 
                                                         board[6] + "|" + board[7] + "|" + board[8] + 
                                                         "```");
            }

            if (message.text >= '1' && message.text <= '9') {
                var spot = parseInt(message.text);
                slashCommand.replyPublic(message, spot);
                if (playerTurn == 0){
                board[spot - 1] = 'X';
                playerTurn = 1;
                }
                else {
                    board[spot-1] = 'O'
                    playerTurn = 0;
                }
                slashCommand.replyPublicDelayed(message, "```" + board[0] + "|" + board[1] + "|" + board[2] + 
                                                         "\n_ _ _\n" +
                                                         board[3] + "|" + board[4] + "|" + board[5] +
                                                         "\n_ _ _\n" + 
                                                         board[6] + "|" + board[7] + "|" + board[8] + 
                                                         "```");
            }
            
            // If we made it here, just echo what the user typed back at them
            else slashCommand.replyPrivate( message, message.text );

            break;
        default:
            slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }

})
;
