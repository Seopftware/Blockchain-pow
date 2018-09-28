const _ = require("lodash"),
  Transactions = require("./transactions");

const { validateTx } = Transactions;

let mempool = [];

const getMempool = () => _.cloneDeep(mempool);

const getTxInsInPool = mempool => {
  return _(mempool)
    .map(tx => tx.txIns)
    .flatten()
    .value();
};

const isTxValidForPool = (tx, mempool) => {
  const txInsInPool = getTxInsInPool(mempool);

  const isTxInAlreadyInPool = (txIns, txIn) => {
    return _.find(txIns, txInInPool => {
      return (
        txIn.txOutIndex === txInInPool.txOutIndex &&
        txIn.txOutId === txInInPool.txOutId
      );
    });
  };

  for (const txIn of tx.txIns) {
    if (isTxInAlreadyInPool(txInsInPool, txIn)) {
      return false;
    }
  }
  return true;
};

const hasTxIn = (txIn, uTxOutList) => {
  const foundTxIn = uTxOutList.find(
    uTxO => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex
  );

  return foundTxIn !== undefined;
};

const updateMempool = uTxOutList => {
  const invalidTxs = [];

  for (const tx of mempool) {
    for (const txIn of tx.txIns) {
      if (!hasTxIn(txIn, uTxOutList)) {
        invalidTxs.push(tx);
        break;
      }
    }
  }

  if (invalidTxs.length > 0) {
    mempool = _.without(mempool, ...invalidTxs);
  }
};

const addToMempool = (tx, uTxOutList) => {
  if (!validateTx(tx, uTxOutList)) {
    throw Error("This tx is invalid. Will not add it to pool");
  } else if (!isTxValidForPool(tx, mempool)) {
    throw Error("This tx is not valid for the pool. Will not add it.");
  }
  mempool.push(tx);
};

module.exports = {
  addToMempool,
  getMempool,
  updateMempool
};