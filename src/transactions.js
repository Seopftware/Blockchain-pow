const CryptoJS = require("crypto-js"),
    ellipic = require("elliptic"),
    utils = require("./utils")

const ec = new elliptic.ec('secp256k1'); // elliptic라이브러리를 사용하기 위해서는 initialize가 필요.

const COINBASE_AMOUNT = 50; // 채굴시 얻게될 수량

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
let uTxOuts=[]; // uTxOutList는 여러개의 unspent transaction ouput을 뜻함 (아웃풋의 총합)

// get transaction id => hash 값임
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
        uTxO => uTxO.txOutId === txOutId && uTxO.txOutIndex === txOutIndex);
}

// tx에 input에 사인하는 건 나다.
const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {
    const txIn = tx.txIns[txInIndex];
    const dataToSign = tx.id; // check transaction id
    const referencedUTxOut = findUTxOut(txIn.txOutId, tx.txOutIndex, uTxOuts); // 리스트 안의 Unspent Transaction Output을 찾는 과정
    if(referencedUTxOut === null){ // 내가 쓸 수 있는 코인이 없다는 뜻
        return;
    }

    // 존재하는 주소인지 체크 (트랜잭션 인풋 주소가 지갑에서 얻은 주소와 같은지 체크)
    const referencedAddress = referencedTxOut.address;
    if(getPublickey(privateKey) !== referencedAddress){
        return false;
    }
    const key = ec.keyFromPrivate(privateKey, "hex");
    const signature = uills.toHexString(key.sign(dataToSign).toDER()); // DER encoding
    return signature;
};

// wallet.js에 똑같은 기능의 함수가 있지만, circular input을 방지하기 위해 함수를 하나 더 생성
const getPublickey = (privateKey) => {
    return ec
        .keyFromPrivate(privateKey, "hex")
        .getPublic()
        .encode("hex");
}


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

    const isTxInStructureValid = (txIn) => {
        if(txIn === null){
            return false;
        }else if(typeof txIn.signature!=="string"){
            return false;
        }else if(typeof txIn.txOutId !== "string"){
            return false;
        }else if(typeof txIn.txOutIndex !== "number"){
            return false;
        }else{
            return true;
        }
    }

    const isAddressValid = (address) => {
        if(address.length !== 130){ //현재 우리가 사용하는 라이브러리의 address 주소 길이는 300이다.
            return false;
        }else if(address.match("^[a-fA-F0-9]+$") === null){ // address는 hexadecimal pattern(^[a-fA-F0-9]+$)과 매칭이 되어야 한다.
            return false;
        }else if(!address.startsWith("04")){ // addres가 04로 시작하지 않는 경우
            return false;
        }else{
            return true;
        }
    }
    const isTxOutStructureValid = (txOut) => {  
        if(txOut === null){
            return false;
        }else if(typeof txOut.address !== "string"){
            return false;
        }else if(!isAddressValid(txOut.address)){
            return false;
        }else if(typeof txOut.amount !=="number"){
            return false;
        }else{
            return true;
        }

    }
    const isTxStructureValid = (tx) => {

        if(typeof tx.id !== "string"){
            console.log("Tx ID is not valid");
            return false;
        }else if(!(tx.txIns instanceof Array)){ // transaction must have input
            console.log("The txIns are not an array");
            return false;
        }else if(!tx.txIns.map(isTxInStructureValid().reduce((a, b) => a && b, true))){
            console.log("The structure of one of the txIn is not valid");
            return false;
        }else if(!(tx.txOuts instanceof Array)){
            console.log("The txOuts are not an array");
            return false;
        }else if(!tx.txOuts.map(isTxOutStructureValid).reduce((a, b) => a && b, true)){
            console.log("The structure of one of the txOut is not valid");
            return false;
        }else{
            return true;
        }
    };

    // 돈을 사용할 사람에 의하여 사인되었음을 체크하는 부분
    // 코인의 주인임을 증명하는 방법 => 트랜잭션의 인풋 사인, 나의 주소가 트랜잭션 ID로 사인을 증명할 수 있기 떄문
    const validateTxIn = (txIn, tx, uTxOutList) => {
        const wantedtxOut = uTxOutList
        .find(uTxO => uTxO.txOutId === txIn.txOutId 
            && uTxO.txOutIndex === txIn.txOIndex);

        if(wantedtxOut === null){ // 만약, 원하는 ouput을 찾지 못했을 경우(즉, 돈을 보내는 사람이 쓸 돈이 없다는 뜻이기도 함)
            return false;
        }else{
            const address = wantedtxOut.address;
            const key = ec.keyFromPublic(address, "hex"); // 주소 검증
            return key.verify(tx.id, txIn.signature); // 나의 프라이빗 키로 사인을 하면, 나중에 내가 사인했다는 것을 나의 퍼블릭 키로 증명을 할 수 있게 된다.
        }           
    }

    // 트랜잭션 인풋의 수량을 체크하기 위해 필요한 함수 (트랜잭션 아웃풋과 달리 인풋에서는 갯수를 볼 수 없기 때문에)
    const getAmountInTxIn = (txIn, uTx) => findUTxOut(txIn.txOutId, txIn.txOutIndex, uTxOutList).amount // 트랜잭션 인풋과 아웃풋 리스트를 가져와야함 (트랜잭션 아웃풋은 Array에 있다.)

    const validateTx = (tx, uTxOutList) => {
        if(!isTxStructureValid(tx)){
            return false;
        }

        if(getTxId(tx) !== tx.id){
            return false;
        }

        // 트랜잭션 인풋이 유효한지 검증
        const hasValidTxIns = tx.txIns.map(txIn => validateTxIn(txIn, tx, uTxOutList));
        if(!hasValidTxIns){
            return false;
        }

        // 트랜잭션이 유효한 인풋을 가지고 있으면
        const amountInTxIns = tx.txIns
            .map(txIn => getAmountInTxIn(txIn, uTxOutList))
            .reduce((a, b) => a + b, 0);

        const amountInTxOuts = tx.txOuts
            .map(txOut => txOut.amount)
            .reduce((a, b) => a + b, 0);

        // if i want to give 10, Input 50 => Output 40 & 10 
        if(amountInTxIns !== amountInTxOuts){
            return false;
        }else{
            return true;
        }
    };

    // coin base tx has only one input & output
    const validateCoinbaseTx = (tx, blockIndex) => {
        if(getTxId(tx) !== tx.id){
            return false;
        }else if(tx.txIns.length !== 1){ // coin base tx have only one input tx from the blockchain, 1개 이상의 tx면 무효!
            return false;
        }else if(tx.txIns[0].txOutIndex !== blockIndex){
            return false;
        }else if(tx.txOuts.length !== 1){ // 아웃풋은 채굴자에게 가고, 채굴자는 한 명!
            return false;
        }else if(tx.txOuts[0].amount !== COINBASE_AMOUNT){ // 유일한 아웃풋의 수량이 내가 정한 수량보다 크다면
            return false;
        }else{
            return true;
        }
    }

    module.export = {
        getPublicKey,
        getTxId,
        signTxIn
    }