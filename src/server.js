const express = require("express"),
  bodyParser = require("body-parser"),
  morgan = require("morgan"),
  Blockchain = require("./blockchain"),
  P2P = require("./p2p"),
  Wallet = require("./wallet");

const { getBlockchain, createNewBlock, getAccountBalance } = Blockchain;
const { startP2PServer, connectToPeers} = P2P;
const { initWallet } = Wallet;
// environment varialbe call PORT if doesn't find it => 3000
// typing 'export HTTP_PORT=4000' in your console
const PORT = process.env.HTTP_PORT || 3003;

const app = express();
app.use(bodyParser.json());
app.use(morgan("combined"));


app
  .route("/blocks")
  .get((req, res) => {
    res.send(getBlockchain());
  })
  .post((req, res) => {
    const newBlock = createNewBlock();
    res.send(newBlock);
  });

app.post("/peers", (req, res) => {
  // get peer in body data
  const { body: { peer } } = req; // url which is running ws server
  connectToPeers(peer); // connect To peer
  res.send(); // kill the connection
});

app.get("/me/balance", (req, res) => {
  const balance = getAccountBalance();
  res.send({balance});
});

// we need to give to the p2p server the express server
const server = app.listen(PORT, () => 
console.log(`TripCoin Server running on ${PORT} ✅`));

initWallet();
startP2PServer(server);


