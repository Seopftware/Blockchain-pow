const WebSockets = require("ws"),
    Blockchain = require("./blockchain"); // getting the block chain cause there is a data


const { 
    getNewestBlock, 
    isBlockStructureValid, 
    replaceChain, 
    getBlockchain,
    addBlockToChain
    } = Blockchain;

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
        type: GET_ALL,
        data: null
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
                sendMessage(ws, responseLatest());
                break;
            case GET_ALL:
                sendMessage(ws, responseAll());
                break;
            case BLOCKCHAIN_RESPONSE:
                const receivedBlocks = message.data;
                if(receivedBlocks === null){ // no block
                    break;
                }
                handleBlockchainResponse(receivedBlocks);
                break;


        }
    });
};

const handleBlockchainResponse = receivedBlocks => {
    if (receivedBlocks.length === 0){
        console.log("Received blocks have a length of 0");
        return;
    }
    const latestBlockReceived = receivedBlocks[receivedBlocks.length -1]; // if get 1 block it means 0 index, 20 block 19 index

    if(!isBlockStructureValid(latestBlockReceived)){
        console.log("The block strucutre of the block received is not valid")
        return;
    }

    const newestBlock = getNewestBlock();
    // 내가 받은 블록체인의 인덱스가 나의 블록체인 인덱스보다 작을 때 (우리보다 앞선 블록을 받은 경우)
    if(latestBlockReceived.index > newestBlock.index){
        if(newestBlock.hash === latestBlockReceived.previousHash){ // 1 블록만 앞선 경우
            if(addBlockToChain(latestBlockReceived)){ // 만약, 새로운 블록 생성에 성공하면 (true)
                broadcastNewBlock(); // 전체 노드에게 broad casting
            }
        }
        else if(receivedBlocks.length === 1){ // 2개 이상의 블록이 앞선 경우 (블록체인 전체를 가져와서 바꾼다.)
            sendMessageToAll(getAll());
        }
        else{
            replaceChain(receivedBlocks);
        }
    }
};

const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

const sendMessageToAll = message => sockets.forEach(ws => sendMessage(ws, message));

const responseLatest = () => blockchainResponse([getNewestBlock()]);

const responseAll = () => blockchainResponse(getBlockchain());

const broadcastNewBlock = () => sendMessageToAll(responseLatest());

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
    connectToPeers,
    broadcastNewBlock
}