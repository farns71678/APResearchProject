const fs = require('node:fs/promises');
const express = require('express');
const app = express();
const port = 3000;
let maleData = null;
let femaleData = null;

console.log(randomBirthDate());

app.get("/", async (req, res) => {
    //res.send("Random User: " + randomBirthDate());
    maleData = await readMaleFirstNames();
    femaleData = await readFemaleFirstNames();
    
    res.send(maleData + " <br><br> " + femaleData);
});

app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port);
});

function createUser() {
    // gender: false = male, true = female
    let user = { name: "", birthdate: "", email: "", ssn: 0, gender: false};
}

// creates a random birth date from 1940 to 2040
function randomBirthDate() {
    // range 1940 to 2040
    let year = Math.floor(40 + Math.random() * 100);
    let month = Math.floor(Math.random() * 12);
    let date = Math.floor(Math.random() * 30.5);
    return (new Date(Date.UTC(year, month, date))).toISOString();
}

function randomSSN() {
    return Math.floor(Math.random * 1000000000);
}

function randomGender() {
    return (Math.random() * 2 < 1);
}

// generates random name (first and last)
// first names are created using the top 1000 names in US from https://www.thenamegeek.com/most-common-female-names based off of data from SSA
function randomName() {
    
}

async function readMaleFirstNames() {
    try {
        let data = await fs.readFile(__dirname + "/maleNames.csv", {encoding: 'utf-8'});
        return data;
    }
    catch (err) {
        console.log(err);
        return null;
    }
}

async function readFemaleFirstNames() {
    try {
        let data = await fs.readFile(__dirname + "/femaleNames.csv", {encoding: 'utf-8'});
        return data;
    }
    catch (err) {
        console.log(err);
        return null;
    }
}