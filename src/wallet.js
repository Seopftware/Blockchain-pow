const elliptic = require("elliptic"),
    path = require("path"),
    fs = require("fs"), // node-module file system
    _ = require("lodash"),
    Transactions = require("./transactions");

const { getPublicKey, getTxId, signTxIn } = Transactions;

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
    
}

// how much send, where send, address, need private key, unspent transaction output
const createTx = (receiverAddress, amount, privateKey, uTxOutList) => {
    const myAddress = getPublicKey(privateKey);
    const myUTxOuts = uTxOutList.filter(uTxO => uTxO.address === myAddress);
    

}

module.exports ={
    initWallet
}