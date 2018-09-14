const elliptic = require("elliptic"),
    path = require("path"),
    fs = require("fs"), // node-module file system
    _ = require("lodash"),
    Transactions = require("./transactions");

const { getPublicKey, getTxId, signTxIn, TxIn, Transaction, TxOut } = Transactions;

const ec = new elliptic.ec('secp256k1');

const privateKeyLocation = path.join(__dirname, "privateKey");

const generatorPrivateKey = () => {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
};

// privateKey 파일로 부터 내용 읽기
const getPrivateFromWallet = () => {
    const buffer = fs.readFileSync(privateKeyLocation, "utf-8");
    buffer.toString();
};

// Get Public address from privateKey 
const getPublicFromWallet = () => {
    const privateKey = getPrivateFromWallet();
    const key = ec.keyFromPrivate(privateKey, "hex");
    return key.getPublic().encode("hex"); // public key
}

// reduce를 사용할 수도 있지만, lodash를 이용해서도 할 수 있다.
const getBalance = (address, uTxOuts) => { // 주소, 아웃풋의 총합
    return _(uTxOuts)
        .filter(uTxO => uTxO.address === address)
        .map(uTxO => uTxO.amount)
        .sum();
}

const initWallet = () => {
    if(fs.existsSync(privateKeyLocation)){ // 이미 파일이 존재한다면 그냥 return
        return;
    }
    const newPrivateKey = generatorPrivateKey();
    fs.writeFileSync(privateKeyLocation, newPrivateKey);
}

// 나의 모든 unspent transaction output을 다 더하면 나의 balance
const findAmountInUTxOuts = (amountNeeded, myUTxOuts) => {
    let currentAmount = 0;
    const inculudedUTxOuts = [];

    // myUTxOut-개별적 하나의 Tx, myUTxOuts-리스트
    for(const myUTxOut of myUTxOuts){
        inculudedUTxOuts.push(myUTxOut);
        currentAmount = currentAmount + myUTxOut.amount;

        if(currentAmount >= amountNeeded){
            const leftOverAmount = currentAmount - amountNeeded; // 남은 수량
            return { inculudedUTxOuts, leftOverAmount };
        }
    }
    console.log("Not enough founds");
}

// 50이 있고, 10을 보냈을 때, 40이남음
// receiverAddress-
// myAddress-transaction output
// amount-내가 타인에게 보내는 수량
// leftOverAmount-나에게 남는 수량
const createTxOut = (receiverAddress, myAddress, amount, leftOverAmount) => {
    const receiverTxOut = new TxOut(receiverAddress, amount);
    if(leftOverAmount === 0 ){
        return [receiverTxOut];
    }else{ // 50이 있고, 10을 보내고, 40이 남는다면
        const leftOverTxOut = new TxOut(myAddress, leftOverAmount); // 남는 40을 받기 위한 tx
        retufn [receiverTxOut, leftOverAmount];
    }

}

// how much send, where send, address, need private key, unspent transaction output
const createTx = (receiverAddress, amount, privateKey, uTxOutList) => {
    const myAddress = getPublicKey(privateKey);
    const myUTxOuts = uTxOutList.filter(uTxO => uTxO.address === myAddress);
    const { inculudedUTxOuts, leftOverAmount } = findAmountInUTxOuts(
        amount, 
        myUTxOuts
    );

    // unspent transaction outputs을 가져다가 인풋으로 만드는 작업
    const toUnsignedTxIn = uTxOut => {
        const txIn = new TxIn();
        txIn.txOutId = uTxOut.txOutId;
        tx.txOutIndex = uTxOut.txOutIndex;
    }

    const unsignedTxIns = inculudedUTxOuts.map(toUnsignedTxIn);
    const tx = new Transaction();

    tx.txIns = unsignedTxIns;
    tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);

    tx.id = getTxId(tx);

    tx.txIns = tx.txIns.map((txIn, index) => {
        txIn.signature = (tx, index, privateKey, uTxOutList);
        return txIn;
    });
    return tx;
};

module.exports ={
    initWallet
}