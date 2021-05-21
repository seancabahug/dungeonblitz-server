const utils = require('./utils');
const { v4: uuidv4 } = require('uuid');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const WebSocket = require('ws');

// Serving webpage
app.use(express.static("./client/build"));

// WebSocket server
const wss = new WebSocket.Server({ server: http });

const games = {};

wss.on('connection', ws => {

    // Preinitialized values for socket
    ws.id = uuidv4();
    ws.connectionAlive = true;
    ws.isHost = false;
    ws.inGame = false;
    ws.roomCode = null;
    ws.playerNumber = 0; // 0 if not in a game, will be from 1 to 4 when assigned in a game

    console.log("got connection with id " + ws.id);

    // Setting up connection detection system
    //ws.on('pong', () => { ws.connectionAlive = true });

    ws.on('message', data => {
        console.log(data);

        function sendError(error) {
            ws.send(JSON.stringify({
                event: "error",
                error: error
            }));
        }

        function clearSocketGameData(ws) {
            ws.isHost = false;
            ws.inGame = false;
            ws.roomCode = null;
            ws.playerNumber = 0;
        }

        data = utils.parseJSON(data, e => {
            sendError("Malformed JSON")
        });

        if (data) {
            switch (data.action) {

                // Requires: nothing
                case 'createRoom':
                    if (!ws.roomCode) {
                        var code = utils.generateSixCharCode();

                        // Ensure that rooms don't have the same room code
                        while (code in games) code = utils.generateSixCharCode();

                        games[code] = {
                            host: ws,
                            players: [],
                            started: false
                        };
                        ws.isHost = true;
                        ws.roomCode = code;
                        ws.send(JSON.stringify({
                            event: "roomCreated",
                            roomCode: code
                        }));
                    }
                    else sendError("Unable to create room");
                    break;

                // Requires: playerInfo[]
                case 'updatePlayerInfo':
                    if (ws.roomCode && ws.inGame && ws.isHost && data.playerInfo) {
                        var players = games[ws.roomCode].players;
                        for (var i = 0; i < data.playerInfo.length; i++) {
                            if (data.playerInfo[i] != null) {
                                players[i].send(JSON.stringify({
                                    event: "updatePlayerInfo",
                                    playerInfo: data.playerInfo[i]
                                }));
                            }
                        }
                    }
                    else sendError("Unable to update player info");
                    break;

                // Requires: String roomCode, String name
                case 'joinRoom':
                    // Check if user gave name and room code, check if user is
                    // in room already, and check if room code is available
                    if (data.name && data.roomCode && !ws.roomCode && data.roomCode in games) {
                        var game = games[data.roomCode];
                        if (!game.started && game.players.length < 4) {
                            ws.playerNumber = game.players.push(ws);
                            ws.roomCode = data.roomCode;
                            game.host.send(JSON.stringify({
                                event: "newPlayer",
                                playerNumber: ws.playerNumber,
                                playerName: data.name
                            }));
                            ws.send(JSON.stringify({
                                event: "joinedRoom",
                                playerNumber: ws.playerNumber,
                                playerName: data.name
                            }));
                        } else sendError("Game has either already started or is full");
                    }
                    else sendError("Unable to join room");
                    break;

                // Requires: int class
                case "switchClass":
                    if (ws.roomCode && !ws.isHost && !ws.inGame && data.class != undefined) {
                        games[ws.roomCode].host.send(JSON.stringify({
                            event: "switchClass",
                            playerNumber: ws.playerNumber,
                            class: data.class
                        }));
                        ws.send(JSON.stringify({
                            event: "switchedClass",
                            class: data.class
                        }));
                    }
                    else sendError("Unable to switch class");
                    break;

                // Requires: boolean ready
                case "updateReady":
                    if (data.ready != undefined && ws.roomCode && !ws.isHost && !ws.inGame) {
                        games[ws.roomCode].host.send(JSON.stringify({
                            event: "switchClass",
                            playerNumber: ws.playerNumber,
                            ready: data.ready
                        }));
                        ws.send(JSON.stringify({
                            event: "updatedReady",
                            ready: data.ready
                        }));
                    }
                    else sendError("Unable to update ready state");
                    break;

                // Requires: playerInfo[]
                // playerInfo must contain info of ALL players
                case "startGame":
                    if (data.playerInfo && ws.isHost && ws.roomCode && !ws.inGame) {
                        var game = games[ws.roomCode];
                        if (game.players.length == 4) {
                            ws.inGame = true;
                            for (var i = 0; i < game.players.length; i++) {
                                game.players[i].inGame = true;
                                game.players[i].send(JSON.stringify({
                                    event: "startedGame",
                                    playerInfo: data.playerInfo[i]
                                }));
                            }
                            game.started = true;
                            ws.send(JSON.stringify({
                                event: "startedGame"
                            }));
                        }
                        else sendError("Need 4 players");
                    }
                    else sendError("Unable to start game");
                    break;

                // Requires: int gameState
                case "updateGameState":
                    if (data.gameState != undefined && ws.isHost && ws.roomCode && ws.inGame) {
                        for (player of games[ws.roomCode].players) {
                            player.send(JSON.stringify({
                                event: "updateGameState",
                                gameState: data.gameState
                            }));
                        }
                    }
                    else sendError("Unable to update game state");
                    break;

                // Requires: int action
                case "sendAction":
                    if (data.actionId != undefined && !ws.isHost && ws.roomCode && ws.inGame) {
                        games[ws.roomCode].host.send(JSON.stringify({
                            event: "playerAction",
                            playerNumber: ws.playerNumber,
                            actionId: data.actionId
                        }));
                    }
                    else sendError("Unable to send action");
                    break;

                // Requires: nothing
                case "endGame":
                    if (ws.isHost && ws.roomCode && ws.inGame) {
                        for (player of games[ws.roomCode].players) {
                            player.send(JSON.stringify({
                                event: 'gameEnding'
                            }));
                            clearSocketGameData(player);
                        }
                        delete games[ws.roomCode];
                        clearSocketGameData(ws);
                        ws.send(JSON.stringify({
                            event: 'endedGame'
                        }));
                    }
                    else sendError("Unable to end game");
                    break;

                default:
                    sendError("Unrecognizable action");
            }
        }
    });
});

http.listen(process.env.PORT || 3000, () => {
    console.log("listening");
});