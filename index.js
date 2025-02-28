const openfs = require('node:fs/promises');
const fs = require('node:fs');
const zlib = require('node:zlib');
const express = require('express');
const { pipeline } = require('node:stream');
const lzma = require('lzma-native');
const crypto = require('crypto');
const app = express();
const port = 3000;
let maleData = null;
let femaleData = null;
let surnameData = null;
let randomNumbers = [];
let randomNumberIndex = 0;
let randomIVs = [];
let randomIVIndex = 0;

// https://nodejs.org/api/zlib.html for compression algorithms (gzip, deflate, and brotli)
// https://www.npmjs.com/package/lzma-native for lzma (used in 7zip)

// data from statista
const emailDomains = [
    { name: "icloud.com", percent: 56.75 },
    { name: "gmail.com", percent: 32.32 },
    { name: "outlook.com", percent: 6.74 },
    { name: "yahoo.com", percent: 4.20 }
];

console.log(randomBirthDate());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/getExample.html");
});

app.get("/generate", async (req, res) => {
    try {
        if (req.query.count == undefined) {
            console.log("/generate request send without 'count' parameter");
            res.status(400).send("Error: include count parameter in request.");
            return;
        }

        console.log('/generate queried with count=%d', parseInt(req.query.count));

        let people = await generateUsers(req.query.count);

        let response = { users: people };
        /*people.forEach((person) => {
            //response += "<div>" + person.name + " " + person.surname + "</div>";

        });*/

        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(response));
        console.log("/generate query completed successfully");
    }
    catch (err) {
        console.log("An unexpected error has occured in /generate: \n" + err);
        res.status(400).send("Sorry, and error has occured");
    }
});

app.get("/names", async (req, res) => {
    //res.send("Random User: " + randomBirthDate());
    let male = await readFirstNames('/maleNames.csv');
    let female = await readFirstNames('/femaleNames.csv');
    let response = "<table><thead><tr><th>ID</th><th>Name</th>People<th>ID</th></tr></thead><tbody>";
    male = male.split('\n');
    male.forEach((row) => {
        let name = row.split(',');
        response += "<tr><td>" + name[0] + "</td><td>" + name[1] + "</td><td>" + name[2] + "</td></tr>"
    });

    response += "</tbody></table><br><br><br><table><thead><tr><th>ID</th><th>Name</th>People<th>ID</th></tr></thead><tbody>";


    female = female.split('\n');
    female.forEach((row) => {
        let name = row.split(',');
        response += "<tr><td>" + name[0] + "</td><td>" + name[1] + "</td><td>" + name[2] + "</td></tr>"
    });

    response += "</tbody></table>";

    res.send(response);
});

app.get('/csv', async (req, res) => {
    if (req.query.count == undefined) {
        console.log("/generate request send without 'count' parameter");
        res.status(400).send("Error: include count parameter in request.");
        return;
    }

    let users = await generateUsers(req.query.count);
    let content = "";

    for (let i = 0; i < users.length; i++) {
        content += users[i].name + "," + users[i].surname + "," + users[i].birthdate + "," + users[i].email + (i < users.length - 1 ? "\n" : "");
    }

    try {
        //await openfs.writeFile(__dirname + '/users.csv', content);
        let out = fs.createWriteStream(__dirname + "/users.csv.xz");

        pipeline(content, lzma.createCompressor(), out, (err) => {
            if (err) console.log("An error occured while compressing data: \n" + err);
            else console.log("Compression succeeded");
        });
    }
    catch (err) {
        console.log(err);
    }
    
    res.status(200).send("Wrote to file");
});

/*app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port);
});*/

function createUser() {
    // gender: false = male, true = female
    let g = randomGender();
    let user = { name: randomName((g ? femaleData : maleData)), surname: randomName(surnameData), username: "", birthdate: randomBirthDate(), email: "", ssn: randomSSN(), gender: g};
    user.email = randomEmail(user.name, user.surname);
    user.username = (user.name.length < 5 ? user.name : user.name.substr(0, 5))
    + (user.surname.length < 5 ? user.surname : user.surname.substr(0, 5));
    return user;
}

// creates a random birth date from 1940 to 2040
function randomBirthDate() {
    // range 1940 to 2040
    let year, month, date;
    if (randomNumbers.length == 0) {
        year = Math.floor(40 + Math.random() * 100) + 1900;
        month = Math.floor(Math.random() * 12);
        date = Math.floor(Math.random() * 30.5);
    }
    else {
        year = Math.floor(40 + getRandomNumber() * 100) + 1900;
        month = Math.floor(getRandomNumber() * 12) + 1;
        date = Math.floor(getRandomNumber() * 31);
    }
    return (new Date(Date.UTC(year, month, date))).toISOString();
}

function randomSSN() {
    if (randomNumbers.length == 0) return Math.floor(Math.random() * 1000000000);
    return Math.floor(getRandomNumber() * 1000000000);
}

function randomGender() {
    if (randomNumbers.length == 0) return (Math.random() * 2 < 1);
    return (getRandomNumber() * 2 < 1);
}

// generates random name (first and last)
// first names are created using the top 1000 names in US from https://www.thenamegeek.com/most-common-female-names based off of data from SSA
// surname data in US from https://namecensus.com/last-names/ with a total of 5000 names;
function randomName(data) {
    const max = data[data.length - 1].num;
    let target = (randomNumbers.length == 0 ? Math.random() * max : getRandomNumber() * max);
    let ret = findName(data, target, 0, data.length - 1);
    return ret;
}

// uses binary search to approxamate name
function findName(data, target, start, end) {
    while (start <= end) {
        let mid = Math.floor(start + (end - start) / 2);
        if (data[mid].num > target) end = mid - 1;
        else if (data[mid].num < target) start = mid + 1;
        else return data[mid].name;
    }
    return data[start].name;
}

// makes a random email in the format first.lastNN@domain
function randomEmail(firstName, surname) {
    let randDigits = "";
    if (randomNumbers.length == 0 && Math.random() < 0.85) randDigits = Math.floor(Math.random() * 100);
    else if (randomNumbers.length == 0 && getRandomNumber() < 0.85) randDigits = Math.floor(getRandomNumber() * 100);
    let percent = (randomNumbers.length == 0 ? Math.random() * 100 : getRandomNumber());
    let provider = "";
    let total = 0;
    for (let i = emailDomains.length - 1; i >= 0 && provider == ""; i--) {
        total += emailDomains[i].percent;
        if (total >= percent) provider = emailDomains[i].name;
    }
    if (provider == "") provider = "gmail.com";

    return firstName.toLowerCase() + "." + surname.toLowerCase() + randDigits + "@" + provider;
}

function getRandomNumber() {
    if (randomNumberIndex == randomNumbers.length - 1) randomNumberIndex = 0;
    else randomNumberIndex++;
    return randomNumbers[randomNumberIndex];
}

function getRandomIV() {
    if (randomIVIndex > randomIVs.length - 4) randomIVIndex = Math.floor(getRandomNumber() * 3);
    else randomIVIndex += 3;
    return randomIVs[randomIVIndex];
}

function getCurrentCommandIndex() {
    currentCommandIndex++;
    return currentCommandIndex;
}

async function readNames(file) {
    try {
        let data = await openfs.readFile(__dirname + file, {encoding: 'utf-8'});
        return data;
    }
    catch (err) {
        console.log(err);
        return null;
    }
}

async function parseNames(data) {
    try { 
        let rows = data.split('\n');
        let ret = [];
        let total = 0;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i].split(',');
            total += parseInt(row[1]);
            ret.push({ name: row[0], num: total });
        }
        return ret;
    }
    catch (err) {
        console.log("Unable to parse names: \n" + err);
        return null;
    }
}

async function generateUsers(count) {
    if (maleData == null) {
        let male = await readNames('/maleNames.csv');
        if (male == null) {
            res.status(400).send("An unexpected error occured when trying to parse male first names.");
            return;
        }
        maleData = await parseNames(male);
    }

    if (femaleData == null) {
        let female = await readNames('/femaleNames.csv');
        if (female == null) {
            res.status(400).send("An unexpected error occured when trying to parse female first names.");
            return;
        }
        femaleData = await parseNames(female);
    }

    if (surnameData == null) {
        let surname = await readNames('/lastNames.csv');
        if (surname == null) {
            res.status(400).send("An unexpected error occured when trying to parse surnames.");
            return;
        }
        surnameData = await parseNames(surname);
    }


    let people = [];
    for (let i = 0; i < parseInt(count); i++) {
        people.push(createUser());
    }

    return people;
}



app.get('/simulate-blockchain', async (req, res) => {
    // check to see if they are there and if they are make sure they are valid
    if (req.query.users == undefined || req.query.type == undefined) {
        res.status(400).send("Err: must include 'users' and 'type' queries.");
    }
    else if (parseInt(req.query.users) == NaN 
            || (req.query.type != "gzip" 
                && req.query.type != "lzma" 
                && req.query.type != "deflate" 
                && req.query.type != "brotli")
                && req.query.type != "none") {
        res.status(400).send("Err: query data was invalid.");
    }

    // all's well with the query so start creating blockchain and return good
    createBlockchain(req.query.users, req.query.type);

    res.status(200).send("Creating Blockchain with user pool size: " + req.query.users + " and compression type: " + req.query.type);

});

/* actuall blockchain simulator

Binary File Format:
    uint32_t - number of blocks in blockchain (set to zero)
    Block - block format

Block Data Format:
    32 bytes - SHA256 of previous block (just set to zeros b/c it doesn't matter when testing file size)
    uint32_t - nonce (set to zero)
    uint16_t - number of commands in the block (set to zero)
    uint64_t - size of block data (in bytes set to zero)
    CommandData - may include up to 2000 of any UserCreateCommand, ModifyDataCommand, or DeleteUserCommand
    32 bytes - SHA256 of current block (set to zero)

UserCreateCommand:
    uint16_t - size of command in bytes
    16 bytes - initialization vector (for AES)
    uint64_t - command number (over all in blockchain)
    5 bytes - one byte for size of each piece of data except for gender (in character length)
    username
    firstname
    surname
    birthdate
    email
    gender

ModifyDataCommand:
    uint16_t - size of command in bytes
    16 bytes - initialization vector (for AES)
    uint64_t - command number (over all in blockchain)
    uint8 - index of data to modify
    uint8 - size of new value
    data

DeleteUserCommand:
    uint16_t - size of command in bytes
    16 bytes - initialization vector (for AES)
    uint64_t - command number (over all in blockchain)
    1 byte - size of username
    username
*/

/*
Parameters are either String or Integer, Integer
*/
function toHexString() {
    if (arguments.length == 1) return Buffer.from(arguments[0], 'utf-8').toString('hex');
    return arguments[0].toString(16).padStart(arguments[1] * 2, '0');
}

function encrypt(data, key) {
    const iv = getRandomIV(); // Initialization vector
    key = crypto.scryptSync(key, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'hex', 'hex') + cipher.final('hex');
    return iv.toString('hex') + encrypted;
}

const passwordCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -*^&%!@#$()+_<>";
let passwordString = "";
let passwordStringLen = 0;

async function createBlockchain(userSize, compressionType) {
    maleData = null;
    femaleData = null;
    surnameData = null; 
    randomNumbers = [];
    randomNumberIndex = 0;
    randomIVs = [];
    randomIVIndex = 0;
    fs.writeFileSync(__dirname + "/blockchain.bin", Buffer.from(toHexString(0, 8), 'hex'));
    let stream = fs.createWriteStream(__dirname + "/blockchain.bin", {flags: 'a'});

    console.log("Creating Blockchain Size: " + userSize + ", Type: " + compressionType);

    // generate random numbers
    let randomNumberSize = 1000;
    randomNumbers.length = randomNumberSize;
    for (let i = 0; i < randomNumberSize; i++) {
        randomNumbers[i] = Math.random();
    }

    let randomIVSize = 500;
    randomIVs.length = randomIVSize;
    for (let i = 0; i < randomIVSize; i++) {
        randomIVs[i] = crypto.randomBytes(16);
    }

    // initialize compression
    let comp = null;
    if (compressionType == "lzma") {
        comp = lzma.createCompressor();
    } else if (compressionType == "gzip") {
        comp = zlib.createGzip();
    } else if (compressionType == "brotli") {
        comp = zlib.createBrotliCompress();
    } else if (compressionType == "deflate") {
        comp = zlib.createBrotliCompress();
    }
    // create commands
    let blockHeader = toHexString(0, 64);
    let blockFooter = toHexString(0, 32);
    let blocksCreated = 0;
    for (let i = 0; i < Math.ceil(userSize / 2000); i++) {
        // generate random password string
        passwordString = "";
        for (let i = 0; i < 50; i++) {
            passwordString += passwordCharacters[Math.floor(getRandomNumber() * passwordCharacters.length)];
        }
        passwordStringLen = passwordString.length;

        // create commands
        let users = await generateUsers(2000);
        let commands = createCommands(users);
        for (let i = 0; i < Math.ceil(commands.length / 2000); i++) {
            let blockData = "";
            let passwordIndex = 0;
            let maxIndex = Math.min((i + 1) * 2000, commands.length);
            for (let j = i * 2000; j < maxIndex; j++) {
                let password = "";
                if (passwordIndex < passwordStringLen - 10) {
                    passwordIndex += 7;
                }
                else {
                    passwordIndex = Math.floor(getRandomNumber() * 7);
                }
                password = passwordString.substring(passwordIndex, passwordIndex + 10);
                let encryptedCommand = encrypt(commands[j], password);
                blockData += toHexString(encryptedCommand.length, 2) + encryptedCommand;
            }
            let block = blockHeader + blockData + blockFooter;
            let writeData = "";
            if (comp != null) {
                pipeline(block, comp, writeData, (err) => {
                    console.log("An error occured when compressing block: " + blocksCreated);
                });
            }
            await writeBlock(writeData, stream);
            blocksCreated++;
        }
    }

    stream.end();

    console.log("Created Blockchain File");
    const stats = fs.statSync(__dirname + "/blockchain.bin");
    console.log(`File Size: ${stats.size}\nBlocks: ${blocksCreated}\n`);
    const outputStream = fs.createWriteStream(__dirname + "/blockchainData.csv", {flags: 'a'});
    outputStream.write("\n" + userSize + "," + compressionType + "," + stats.size + "," + blocksCreated);
    outputStream.end();
}

function createCommands(users) {
    let commands = [];
    commands.length = users.length * 3;
    for (let i = 0; i < users.length; i++) {
        // create user command
        let createCommand = "0a"
            + toHexString(users[i].username.length, 1)
            + toHexString(users[i].surname.length, 1)
            + toHexString(users[i].email.length, 1)
            + toHexString(users[i].name.length, 1)
            + toHexString(users[i].birthdate.length, 1)
            + toHexString(users[i].username
                 + users[i].surname
                 + users[i].email
                 + users[i].name
                 + users[i].birthdate)
            + (users[i].gender ? "01" : "00");
        
        // modify data command
        let modifyRand = getRandomNumber() < 0.5;
        let modifyCommand = toHexString((modifyRand ? users[i].surname : users[i].email).length, 1)
            + toHexString((modifyRand ? users[i].surname : users[i].email));
        
        // delete user or modify data command
        let lastCommand = "";
        if (getRandomNumber() < 0.7) {
            let modifyRandLast = getRandomNumber() < 0.5;
            lastCommand = toHexString((modifyRandLast ? users[i].surname : users[i].email).length, 1)
                + toHexString((modifyRandLast ? users[i].surname : users[i].email));
        }
        else {
            // delete user command
            lastCommand = toHexString(users[i].username.length, 1)
                + toHexString(users[i].username);
        }

        let index = i * 3;
        commands[index] = createCommand;
        commands[index + 1] = modifyCommand;
        commands[index + 2] = lastCommand;
    }
    return commands;
}

async function writeBlock(blockData, stream) {
    stream.write(Buffer.from(blockData, 'hex'));
}

let tests = [
    {size: 10000, type: "none"}
];

(async () => {
    for (let i = 0; i < tests.length; i++) {
        await createBlockchain(tests[i].size, tests[i].type);
    }
})();