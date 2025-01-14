const fs = require('node:fs/promises');
const express = require('express');
const app = express();
const port = 3000;
let maleData = null;
let femaleData = null;

console.log(randomBirthDate());

app.get("/", (req, res) => {
    res.send("Random User: " + randomBirthDate());
});

app.get("/generate", async (req, res) => {
    if (req.query.count == undefined) {
        console.log("/generate request send without 'count' parameter");
        res.send("Error: include count parameter in request.");
        return;
    }

    let male = await readFirstNames('/maleNames.csv');
    if (male == null) {
        res.send("An unexpected error occured when trying to parse names.");
        return;
    }
    let female = await readFirstNames('/femaleNames.csv');
    if (female == null) {
        res.send("An unexpected error occured when trying to parse names.");
        return;
    }

    maleData = male;
    femaleData = female;

    let people = [];
    for (let i = 0; i < req.query.count; i++) {
        people.push(createUser());
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

app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port);
});

function createUser() {
    // gender: false = male, true = female
    let g = randomGender();
    return { name: randomName(g), birthdate: randomBirthDate() /*, email: ""*/, ssn: randomSSN(), gender: g};
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
function randomName(gender) {
    let data = null;
    if (gender) data = femaleData;
    else data = maleData;
    const max = data[data.length - 1].num;
    let target = Math.random() * max;


}

// uses binary search to approxamate name
function findName(data, target, start, end) {
    if (start == end) {
        
    }

    let mid = Math.round(start + (start - end) / 2);
    if (data[mid].num > target) return findName(data, target, mid, end);
    else if (data[mid].num < target) return findName(data, target, start, mid);
    else return data[mid].name;
}

async function readFirstNames(file) {
    try {
        let data = await fs.readFile(__dirname + file, {encoding: 'utf-8'});
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
        let ret = Array.apply(null, Array(rows.length));
        let total = 0;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i].split(',');
            total += parseInt(row[2]);
            ret[i] = { name: row[1], num: total };
        }
        return ret;
    }
    catch (err) {
        console.log("Unable to parse names: \n" + err);
        return null;
    }
}