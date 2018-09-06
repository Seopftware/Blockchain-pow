const WebSockets = require("ws"),
    Blockchain = require("./blockchain"); // getting the block chain cause there is a data


const { getLastBlock } = Blockchain;
const sockets = [];

const getSockets = () => sockets;

// Message Types
const GET_LATEST = "GET_LATEST";
const GET_ALL = "GET_ALL";
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE";

// Message Creators
const getLatest = () => {
    return {
        type: GET_LATEST,
        data: null
    };
};

const getAll = () => {
    return {
        type:GET_ALL,
        data:null
    };
};

const blockchainResponse = (data) => {
    return {
        type: BLOCKCHAIN_RESPONSE,
        data
    };
};

const startP2PServer = server => {
    const wsServer = new WebSockets.Server({ server });
    wsServer.on("connection", ws => { // when server connecting throguh ws        
    console.log(`Hello Socket`);
    initSocketConnection(ws)
    });
    console.log("TripCoin P2P Server Running!")
};

// work when new socket gets connect
const initSocketConnection = ws => {
    sockets.push(ws);
    handleSocketMessage(ws);
    handleSocketError(ws);
    sendMessage(ws, getLatest());
};

// check the data is possible to make json
const parseData = data => {
    try {
        return JSON.parse(data)
    } catch (error) {
        console.log(error);
        return null;
    }
}
const handleSocketMessage = ws => {
    ws.on("message", data => {
        const message = parseData(data);
        if(message === null){
            return;
        }

        console.log(message);
        switch(message.type){
            case GET_LATEST:    
            sendMessage(ws, getLastBlock());
            break;
        }
    });
};

const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

const handleSocketError = ws => {
    const closeSocketConnection = ws => {
        ws.close();
        sockets.splice(sockets.indexOf(ws), 1); // remove death ws from array
    };

    ws.on("close", () => closeSocketConnection(ws));
    ws.on("error", () => closeSocketConnection(ws));
}

// this function take new url where url socket server is running
const connectToPeers = newPeer => {
    const ws = new WebSockets(newPeer); // create a new socket

    // when open the connection
    ws.on("open", () => {
        initSocketConnection(ws); // start socket connect => put the socket that i connect into array
    });
};

module.exports = {
    startP2PServer,
    connectToPeers
}