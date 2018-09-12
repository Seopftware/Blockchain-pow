const CryptoJS = require("crypto-js"),
    ec = require("elliptic");

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
    constructor(uTxOutId, uTxOutIndex, address, amount){
        this.uTxOutId=uTxOutId;
        this.uTxOutIndex=uTxOutIndex
        this.address=address;
        this.amount=amount;
    }
}

// 모든 unspent 트랜잭션 아웃풋을 다 넣어둬야함.
let uTxOuts=[];

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