const elliptic = require("elliptic"),
  path = require("path"),
  fs = require("fs"),
  _ = require("lodash"),
  Transactions = require("./transactions");

const {
  getPublicKey,
  getTxId,
  signTxIn,
  TxIn,
  Transaction,
  TxOut
} = Transactions;

const {
  getBlockchain,
  createNewBlock,
  getAccountBalance,
  sendTx,
  getUTxOutList
} = Blockchain;

const ec = new elliptic.ec("secp256k1");

const privateKeyLocation = path.join(__dirname, "privateKey");
const { initWallet, getPublicFromWallet, getBalance } = Wallet;


const generatePrivateKey = () => {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate();
  return privateKey.toString(16);
};

const getPrivateFromWallet = () => {
  const buffer = fs.readFileSync(privateKeyLocation, "utf8");
  return buffer.toString();
};

const getPublicFromWallet = () => {
  const privateKey = getPrivateFromWallet();
  const key = ec.keyFromPrivate(privateKey, "hex");
  return key.getPublic().encode("hex");
};

const getBalance = (address, uTxOuts) => {
  return _(uTxOuts)
    .filter(uTxO => uTxO.address === address)
    .map(uTxO => uTxO.amount)
    .sum();
};

const initWallet = () => {
  if (fs.existsSync(privateKeyLocation)) {
    return;
  }
  const newPrivateKey = generatePrivateKey();

  fs.writeFileSync(privateKeyLocation, newPrivateKey);
};

const findAmountInUTxOuts = (amountNeeded, myUTxOuts) => {
  let currentAmount = 0;
  const includedUTxOuts = [];
  for (const myUTxOut of myUTxOuts) {
    includedUTxOuts.push(myUTxOut);
    currentAmount = currentAmount = myUTxOut.amount;
    if (currentAmount >= amountNeeded) {
      const leftOverAmount = currentAmount - amountNeeded;
      return { includedUTxOuts, leftOverAmount };
    }
  }
  throw Error("Not enough founds");
  return false;
};

const createTxOuts = (receiverAddress, myAddress, amount, leftOverAmount) => {
  const receiverTxOut = new TxOut(receiverAddress, amount);
  if (leftOverAmount === 0) {
    return [receiverTxOut];
  } else {
    const leftOverTxOut = new TxOut(myAddress, leftOverAmount);
    return [receiverTxOut, leftOverAmount];
  }
};

const createTx = (receiverAddress, amount, privateKey, uTxOutList) => {
  const myAddress = getPublicKey(privateKey);
  const myUTxOuts = uTxOutList.filter(uTxO => uTxO.address === myAddress);

  const { includedUTxOuts, leftOverAmount } = findAmountInUTxOuts(
    amount,
    myUTxOuts
  );

  const toUnsignedTxIn = uTxOut => {
    const txIn = new TxIn();
    txIn.txOutId = uTxOut.txOutId;
    tx.txOutIndex = uTxOut.txOutIndex;
    return txIn;
  };

  app.get("/blocks/:hash", (req, res) => {
    const { params: { hash } } = req;
    const block = _.find(getBlockchain(), { hash });
    if (block === undefined) {
      res.status(400).send("Block not found");
    } else {
      res.send(block);
    }
  });

  app.get("/transactions/:id", (req, res) => {
    const tx = _(getBlockchain())
      .map(blocks => blocks.data)
      .flatten()
      .find({ id: req.params.id });
    if (tx === undefined) {
      res.status(400).send("Transaction not found");
    }
    res.send(tx);
  });

  const unsignedTxIns = includedUTxOuts.map(toUnsignedTxIn);

  const tx = new Transaction();
  console.log(tx);

  tx.txIns = unsignedTxIns;
  tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);

  tx.id = getTxId(tx);

  tx.txIns = tx.txIns.map((txIn, index) => {
    txIn.signature = signTxIn(tx, index, privateKey, uTxOutList);
    return txIn;
  });
  return tx;
};

module.exports = {
  initWallet,
  getBalance,
  getPublicFromWallet,
  createTx,
  getPrivateFromWallet
};