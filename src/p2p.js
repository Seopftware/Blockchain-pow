const WebSockets = require("ws");

const sockets = [];

const getSockets = () => sockets;


const startP2PServer = server => {
    const wsServer = new WebSockets.Server({ server });
    wsServer.on("connection", ws => { // when server connecting throguh ws        
    console.log(`Hello Socket`);
    initSocketConnection(ws)
    });
    console.log("TripCoin P2P Server Running!")
};

// work when new socket gets connect
const initSocketConnection = socket => {
    sockets.push(socket);
    socket.on("message", (data) =>{
        console.log(data);
    });
    // function to send message
    setTimeout(() => {
        socket.send("welcome!")
    }, 5000);
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