const CryptoJS = require("crypto-js"),
hexToBinary = require("hex-to-binary");

const BLOCK_GENERATION_INTERVAL = 10; // 몇 분마다 블록이 채굴되는지 조절. (단위: 초)
const DIFFICULTY_ADJUSMENT_INTERVAL= 10; // 10개의 블록이 생성될 때 마다 난이도 조절(비트코인의 경우 2016)


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

// functional programming
const getNewestBlock = () => blockchain[blockchain.length -1];

const getTimestamp = () => Math.round(new Date().getTime() / 1000); // Math.floor =>

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
    CryptoJS.SHA256(
        index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce
    ).toString();

const createNewBlock = data => {
   const previousBlock = getNewestBlock();
   const newBlockIndex = previousBlock.index + 1;
   const newTimestamp = getTimestamp();
   const difficulty = findDifficulty();
   const newBlock = findBlock(
       newBlockIndex,
       previousBlock.hash,
       newTimestamp,
       data,
       difficulty
   );
    addBlockToChain(newBlock); // 새로운 블록 추가
    // p2p는 block chain을 요구, block chain은 p2p를 요구 (circular dependency 발생)
    require("./p2p").broadcastNewBlock(); // circular dependency를 방지하기 위해 임시방편으로.. // import 없이 함수를 부르는 방법
    return newBlock;
};

const findDifficulty = () => {
    const newestBlock = getNewestBlock(); // 가장 최근의 블록체인
    if(newestBlock.index % DIFFICULTY_ADJUSMENT_INTERVAL === 0 && 
        newestBlock.index !== 0
    ){ // reminder && except genesis block // calculate new difficulty
        return calculateNewDifficulty(newestBlock, getBlockchain());
    }else{
        return newestBlock.difficulty;
    }
};

// 난이도 측정 방법
const calculateNewDifficulty = (newestBlock, blockchain) =>{
    const lastCalculatedBlock = blockchain[blockchain.length - DIFFICULTY_ADJUSMENT_INTERVAL];
    const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSMENT_INTERVAL; // 블록이 생성되기 까지의 예상 시간
    const timeTaken = newestBlock.timestamp - lastCalculatedBlock.timestamp; // 가장 최근 블록과 난이도가 계산된 블록 사이의 소요시간 계산
    
    // 블록을 체굴하는데 걸리는 시간이 에상한 시간보다 짧으면 난이도를 높이기
    if(timeTaken < timeExpected/2){
        return lastCalculatedBlock.difficulty + 1;
    }else if(timeTaken >timeExpected *2){ // 채굴하는데 나의 예상시간 보다 시간이 더 걸린다면 난이도를 줄이기
        return lastCalculatedBlock.difficulty - 1;
    }else{
        return lastCalculatedBlock.difficulty;
    }
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
        }
        nonce++;
    }
};

const hashMathchesDifficulty = (hash, difficulty) => {
    // hash -> binary
    const hashInBinary = hexToBinary(hash);
    const requiredZeros = "0".repeat(difficulty); // difficulty 만큼 0의 갯수가 반복됨.
    console.log("Trying difficulty:", difficulty, "with hash", hashInBinary);
    // 바이너리의 해쉬 숫자가 난이도 만큼 0을 반복한다면
    return hashInBinary.startsWith(requiredZeros); // startsWith() => true / false
}

const getBlockHash = block => 
    createHash(
        block.index, 
        block.previousHash, 
        block.timestamp, 
        block.data, 
        block.difficulty, 
        block.nonce
    );

const isTimeStampValid = (newBlock, oldBlock) => {

    // 타임스탬프가 현재의 사간과 잘 맞는지, 미래 1분부터 과거 1분까지 사이에 반영이 되었는지(즉, 유효하다고 허용하는 시간이 현재 시간의 +,- 1분이라는 뜻)
    return (
        oldBlock.timestamp - 60 < newBlock.timestamp && // oldBlock의 시간이 현재의 블록 시간보다 작은지 체크
        newBlock.timestamp - 60 < getTimestamp()); // 새로운 블록이 현재의 시간보다 작은지
};

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
        console.log("The hash of this block is invaillid");
        return false;
    }
    else if(!isTimeStampValid(candidateBlock, latestBlock)){
        console.log("The timestamp of this block is doggy");
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

// [4**2, 5**2, 2**2, ...] 제곱근 형태로 형성됨.
const sumDifficulty = anyBlockchain => 
    anyBlockchain
        .map(block => block.difficulty)
        .map(difficulty => Math.pow(2, difficulty))
        .reduce((a, b) => a + b);

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