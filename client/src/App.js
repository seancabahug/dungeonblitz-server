import React from 'react';
import useWebSocket from 'react-use-websocket';

import Home from './pages/Home';
import Actions from './pages/Actions';

import './App.css';

// 0 to 5 are replicating the enum order in GameState
const AppState = {
  LOBBY: 0,
  STARTING: 1,
  ENCOUNTERING: 2,
  BATTLE_EXECUTION: 3,
  BATTLE_CONCLUSION: 4,
  STARTING_MENU: 5,
  GAME_ENDING: 6
};

function Page(props) {
  // Conditional rendering
  switch (props.appState) {
    case AppState.STARTING_MENU:
      return <Home sendMessage={props.sendMessage} />
    case AppState.LOBBY:
      return <h1>you're in, {props.playerData.playerName}</h1>
    case AppState.STARTING:
      return <h1>it's starting!</h1>
    case AppState.ENCOUNTERING:
      return <h1>encountering, please hold</h1>
    case AppState.BATTLE_EXECUTION:
      return <Actions sendMessage={props.sendMessage} />
    case AppState.BATTLE_CONCLUSION:
      return <h1>won the battle!</h1>
    case AppState.GAME_ENDING:
      return <h1>Everyone died!</h1>
    default:
      return <h1>sean you suck at programming</h1>
  }
}

function App() {
  const [appState, setAppState] = React.useState(AppState.STARTING_MENU);
  const [playerData, setPlayerData] = React.useState({});

  const { sendMessage } = useWebSocket("ws://" + window.location.hostname + ":3000/", {
    onMessage: (message) => {
      console.log(message);
      var data = JSON.parse(message.data);

      if (data.event === "updateGameState") {
        setAppState(data.gameState);
      }

      switch (appState) {
        case AppState.STARTING_MENU:
          if (data.event === "joinedRoom") {
            setPlayerData({
              playerName: data.playerName,
              playerNumber: data.playerNumber
            });
            setAppState(AppState.LOBBY);
          }
          break;
        case AppState.LOBBY:
          if (data.event === "startedGame") {

          }
          break;
        case AppState.BATTLE_EXECUTION:
          if (data.event === "gameEnding") {
            setPlayerData({});
            setAppState(AppState.GAME_ENDING);
            setTimeout(() => {
              setAppState(AppState.STARTING_MENU);
            }, 2000);
          }
          break;
        default:
          console.log("cannot handle " + appState + ", sean you suck at programming");
      }
    }
  });

  return (
    <div className="container">
      <div className="content">
        <Page appState={appState} sendMessage={sendMessage} playerData={playerData} />
      </div>
    </div>
  );
}

export default App;
