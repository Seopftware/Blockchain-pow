const CryptoJS = require("crypto-js"),
    ellipic = require("elliptic"),
    utils = require("./utils")

const ec = new elliptic.ec('secp256ka'); // elliptic라이브러리를 사용하기 위해서는 initialize가 필요.

class TxOut{
    constructor(address, amount){
        this.address=address;
        this.amount=amount;
    }
}

class TxIn{
    // 아직 사용되지 않은 트랜잭션 아웃풋 = 이ㅓㄴ 트랜잭션의 사용되지 않은 아웃풋
    // uTxOutId, uTxOutIndex, Signature
}

class Transaction{
    // ID, txIns[], txOuts[]
}

// Unspent Transaction Output
class UTxOut{
    constructor(txOutId, txOutIndex, address, amount){
        this.txOutId=txOutId;
        this.txOutIndex=txOutIndex;
        this.address=address;
        this.amount=amount;
    }
}

// 모든 unspent 트랜잭션 아웃풋을 다 넣어둬야함.
let uTxOuts=[]; // uTxOutList는 여러개의 unspent transaction ouput을 뜻함

// get transaction id
const getTxId = tx =>{
    // 전체 input transaction을 더한 값
    const txInContent = tx.txIns
        .map(txIn => txIn.uTxOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, "");
        
    const txOutContent = tx.txOuts
        .map(txOut => txOut.address + txOut.amount)
        .reduce((a, b) => a + b, "");

        return CryptoJS.SHA256(txInContent + txOutContent).toString();
}


const findUTxOut = (txOutId, txOutIndex, uTxOutList) => {
    return uTxOutList.find(
        uTxOut => uTxOut.txOutId === txOutId && uTxOut.txOutIndex === txOutIndex);
}

const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {

    const txIn = tx.txIns[txInIndex];
    const dataToSign = tx.id; // check transaction id
    const referencedUTxOut = findUTxOut(txIn.txOutId, tx.txOutIndex, uTxOuts); // 리스트 안의 Unspent Transaction Output을 찾는 과정
    if(referencedUTxOut === null){ // 내가 쓸 수 있는 코인이 없다는 뜻
        return;
    }
    
    const key = ec.keyFromPrivate(privateKey, "hex");
    const signature = uills.toHexString(key.sign(dataToSign).toDER()); // DER encoding
    return signature;
};


const updateUTxOuts = (newTxs, uTxOutList) => {
    // Transaction make transaction outputs
    const newUTxOuts = newTxs // 전체 트랜잭션을 다 살펴보고
    .map(tx => {
        tx.txOuts.map((txOut, index) => { // 아웃풋도 다 살펴보고
            new UTxOut(tx.id, index, txOut.address, txOut.amount); // 새로운 Unspent Transaction Output 생성 // new unspent transaction output을 transaction ouput에서 얻은 후
        });
    })
    .reduce((a, b) => a.contact(b), []);

    const spentTxOuts = newTxs
    .map(tx => tx.txIns)
    .reduce((a, b) => a.contact(b), [])
    .map(txIn => UTxOut(txIn.txOutId, txIn.txOutIndex, "", 0)); // input 50을 비워내는 상황

    const resultingUTxOuts = uTxOutList
        .filter(uTxo => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts)) // unspent 트랜잭션 아웃풋 안에서 내가 사용한 트랜잭션 아웃풋을 찾는 것
        .concat(newUTxOuts); // 새로운 UTxOuts을 array에 추가해주는 역할

        return resultingUTxOuts;
    };  