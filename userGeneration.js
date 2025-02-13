const openfs = require('node:fs/promises');
const fs = require('node:fs');
const zlib = require('node:zlib');
const express = require('express');
const { pipeline } = require('node:stream');
const lzma = require('lzma-native');
const app = express();
const port = 3000;
let maleData = null;
let femaleData = null;
let surnameData = null;

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

app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port);
});

function createUser() {
    // gender: false = male, true = female
    let g = randomGender();
    let user = { name: randomName((g ? femaleData : maleData)), surname: randomName(surnameData), birthdate: randomBirthDate(), email: "", ssn: randomSSN(), gender: g};
    user.email = randomEmail(user.name, user.surname);
    return user;
}

// creates a random birth date from 1940 to 2040
function randomBirthDate() {
    // range 1940 to 2040
    let year = Math.floor(40 + Math.random() * 100) + 1900;
    let month = Math.floor(Math.random() * 12);
    let date = Math.floor(Math.random() * 30.5);
    return (new Date(Date.UTC(year, month, date))).toISOString();
}

function randomSSN() {
    return Math.floor(Math.random() * 1000000000);
}

function randomGender() {
    return (Math.random() * 2 < 1);
}

// generates random name (first and last)
// first names are created using the top 1000 names in US from https://www.thenamegeek.com/most-common-female-names based off of data from SSA
// surname data in US from https://namecensus.com/last-names/ with a total of 5000 names;
function randomName(data) {
    const max = data[data.length - 1].num;
    let target = Math.random() * max;
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
    if (Math.random() < 0.85) randDigits = Math.floor(Math.random() * 100);
    let percent = Math.random() * 100;
    let provider = "";
    let total = 0;
    for (let i = emailDomains.length - 1; i >= 0 && provider == ""; i--) {
        total += emailDomains[i].percent;
        if (total >= percent) provider = emailDomains[i].name;
    }
    if (provider == "") provider = "gmail.com";

    return firstName.toLowerCase() + "." + surname.toLowerCase() + randDigits + "@" + provider;
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