const CryptoJS = require("crypto-js"),
hexToBinary = require("hex-to-binary")

class Block{
    // the function gets called every time we made new block
    constructor(index, hash, previousHash, timestamp, data, difficulty, nonce){
        this.index=index;
        this.hash=hash;
        this.previousHash=previousHash;
        this.timestamp=timestamp;
        this.data=data;
        this.difficulty=difficulty;
        this.nonce=nonce;
    }
}

// make first block
// hash from SHA256 Hash Generator
const genesisBlock = new Block(
    0,
    "7043EEC2224776975E5B4AA39A2AD575D0F9F70873A232BBF61F627F12601DB0",
    null,
    1535943926.164,
    "This is the Genesis Block!",
    0,
    0
)

// block chain is array of block
let blockchain = [genesisBlock];

// console.log(blockchain) // first block

// functional programming
const getNewestBlock = () => blockchain[blockchain.length -1];
const getTimestamp = () => new Date().getTime() / 1000;
const getBlockchain = () => blockchain;
const createHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
    CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data + difficulty + nonce)).toString();

const createNewBlock = data => {
   const previousBlock = getNewestBlock();
   const newBlockIndex = previousBlock.index + 1;
   const newTimestamp = getTimestamp();

   const newBlock = findBlock(
       newBlockIndex,
       previousBlock.hash,
       newTimestamp,
       data,
       10 // dificultty
   );
    addBlockToChain(newBlock); // 새로운 블록 추가
    // p2p는 block chain을 요구, block chain은 p2p를 요구 (circular dependency 발생)
    require("./p2p").broadcastNewBlock(); // circular dependency를 방지하기 위해 임시방편으로.. // import 없이 함수를 부르는 방법
    return newBlock;
};

const findBlock = (index, previousHash, timestamp, data, difficulty)=>{
    let nonce = 0;

    // find hash
    while(true){
        console.log("Current Nonce", nonce);
        const hash = createHash(
            index,
            previousHash,
            timestamp,
            data,
            difficulty, // difficulty is number of continuous front 0
            nonce
        );

        // check amount of zeros (hashMathches Difficulty)
        if(hashMathchesDifficulty(hash, difficulty)){
            return new Block(
                index,
                hash,
                previousHash,
                timestamp,
                data,
                difficulty,
                nonce
            );
        }else{
            nonce++;
        }
    }
}

const hashMathchesDifficulty = (hash, difficulty) => {
    // hash -> binary
    const hashInBinary = hexToBinary(hash);
    const requiredZeros = "0".repeat(difficulty); // difficulty 만큼 0의 갯수가 반복됨.
    console.log("Trying difficulty:", difficulty, "with hash", hash);
    // 바이너리의 해쉬 숫자가 난이도 만큼 0을 반복한다면
    return hashInBinary.startsWith(requiredZeros); // startsWith() => true / false
}

const getBlockHash = block => createHash(block.index, block.previousHash, block.timestamp, block.data);

// Validate of block data
const isBlockValid = (candidateBlock, latestBlock) => { // invallid new block
    if(!isBlockStructureValid(candidateBlock)){
        console.log("The candidate block structure is not valid");
        return false;
    }    
    else if(latestBlock.index +1 !==candidateBlock.index){ // index
        conolse.log("The candidate block doestn't have a valid index");
        return false;
    }
    else if(latestBlock.hash !== candidateBlock.previousHash){ // block hash
        console.log("The previous hash of the candidate block is not the hash of the latest block");
        return false;
    }
    else if(getBlockHash(candidateBlock) !== candidateBlock.hash){ // hash check again 
        console.log("The hash of this block is invaillid")
        return false;
    }
    return true;
}

// Validate of block structure
const isBlockStructureValid = block => {
    // true or false
    return(
        typeof block.index === 'number' 
        && typeof block.hash === 'string'  
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string'
    )
}

// Validate of Chain => same chain?
const isChainValid = candidateChain => {
    const isGenesisValid = block => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };

    if(!isGenesisValid(candidateChain[0])){
        console.log("The candidateChains genesisBlock is not the same as our genesisBlock");
        return false;
    }

    // i is start 1, because we don't need to check genesisblock (genesis block doesn't have a previous block)
    for(let i=1; i<candidateChain.length; i++){ 
        // candidate block(new block) , latest block(previous block)
        if(!isBlockValid(candidateChain[i], candidateChain[i - 1])){
            return false;
        }
    }
    return true;
}

const replaceChain = candidateChain => {
    // blockchain want more longer chain
    if(isChainValid(candidateChain) && candidateChain.length > getBlockchain().length){
        blockchain = candidateChain;
        return true;
    } else{
        return false;
    }
};

const addBlockToChain = candidateBlock => {
    if(isBlockValid(candidateBlock, getNewestBlock())){
        getBlockchain().push(candidateBlock);
        return true;
    }else{
        return false;
    }
};

module.exports={
    getNewestBlock,
    getBlockchain,
    createNewBlock,
    isBlockStructureValid,
    addBlockToChain,
    replaceChain
}