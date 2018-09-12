const toHexString = bytearray => {
    return Array.from(bytearray, byte =>{
        return ("0" + (byte & oxff).toString(16)).slice(-2);
    }).join("");
};

module.exports = { toHexString };