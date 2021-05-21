import { Button } from '@material-ui/core';

function Actions(props) {
    return <>
        <Button variant="outlined" onClick={() => {
            props.sendMessage(JSON.stringify({
                action: "sendAction",
                actionId: 0
            }));
        }}> Use ability </Button>
    </>
}

export default Actions;