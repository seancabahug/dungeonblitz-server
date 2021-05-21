function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function generateSixCharCode() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    var code = [];
    for (var i = 0; i < 6; i++) {
        code.push(characters.charAt(Math.floor(Math.random() * characters.length)));
    }
    return code.join("");
}

function parseJSON(jsonString, callback) {
    var parsed;
    try {
        parsed = JSON.parse(jsonString);
    } catch (e) {
        callback(e);
    }
    return parsed;
}

module.exports = { generateUUID, generateSixCharCode, parseJSON };