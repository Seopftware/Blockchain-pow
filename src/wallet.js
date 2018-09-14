const elliptic = require("elliptic"),
    path = require("path"),
    fs = require("fs"); // node-module file system


const ec = new elliptic.ec('secp256k1');

const privateKeyLocation = path.join(__dirname, "privateKey");

const generatorPrivateKey = () => {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
};

const initWallet = () => {
    if(fs.existsSync(privateKeyLocation)){ // 이미 파일이 존재한다면 그냥 return
        return;
    }
    const newPrivateKey = generatorPrivateKey();
    fs.writeFileSync(privateKeyLocation, newPrivateKey);
}

module.exports ={
    initWallet
}