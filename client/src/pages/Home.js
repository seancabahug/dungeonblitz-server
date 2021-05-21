import React from 'react';
import {TextField, Button} from '@material-ui/core';

function Home(props) {
    const roomCodeTextBox = React.createRef();
    const nameTextBox = React.createRef();

    return <>
        <TextField inputRef={roomCodeTextBox} placeholder="Room Code" variant="outlined"/>
        <TextField inputRef={nameTextBox} placeholder="Player Name" />
        <Button color="primary" onClick={() => {
            console.log("button click");
            props.sendMessage(JSON.stringify({
                action: "joinRoom",
                roomCode: roomCodeTextBox.current.value,
                name: nameTextBox.current.value
            }));
        }}> Join room </Button>
    </>
}

export default Home;