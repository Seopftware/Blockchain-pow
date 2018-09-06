const WebSockets = require("ws");

const sockets = [];

const getSockets = () => sockets;


const startP2PServer = server => {
    
    const wsServer = new WebSockets.Server({ server });
    
    // when server connecting throguh ws
    wsServer.on("connection", ws => {
        
    console.log(`Hello Socket`);
    });
    console.log("TripCoin P2P Server Running!")
};

const initSocketConnection = socket => {
    sockets.push(socket);
};

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