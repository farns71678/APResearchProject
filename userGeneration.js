const fs = require('node:fs/promises');
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;
let maleData = null;
let femaleData = null;

console.log(randomBirthDate());

app.get("/", (req, res) => {
    res.send("Random User: " + randomBirthDate());
});

app.get("/generate", async (req, res) => {
    try {
        if (req.query.count == undefined) {
            console.log("/generate request send without 'count' parameter");
            res.send("Error: include count parameter in request.");
            return;
        }

        console.log('/generate queried with count=%d', parseInt(req.query.count));

        if (maleData == null) {
            let male = await readFirstNames('/maleNames.csv');
            if (male == null) {
                res.send("An unexpected error occured when trying to parse names.");
                return;
            }
            maleData = await parseNames(male);
        }

        if (femaleData == null) {
            let female = await readFirstNames('/femaleNames.csv');
            if (female == null) {
                res.send("An unexpected error occured when trying to parse names.");
                return;
            }
            femaleData = await parseNames(female);
        }


        let people = [];
        for (let i = 0; i < parseInt(req.query.count); i++) {
            people.push(createUser());
        }

        let response = "";
        people.forEach((person) => {
            response += "<div>" + person.name + "</div>";
        });

        res.send(response);
        console.log("/generate query completed successfully");
    }
    catch (err) {
        console.log("An unexpected error has occured in /generate: \n" + err);
        res.send("Sorry, and error has occured");
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
    if (femaleData == null || maleData == null) throw new TypeError("'femaleData' or 'maleData' is null. ");
    let data = (gender ? femaleData : maleData);
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

/*function findName(data, target, start, end) {
    if (start == end) return data[start].name;

    let mid = Math.round(start + (end - start) / 2);
    if (data[mid].num > target) return findName(data, target, mid, end);
    else if (data[mid].num < target) return findName(data, target, start, mid);
    else return data[mid].name;
}*/

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
        let ret = [];
        let total = 0;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i].split(',');
            total += parseInt(row[2]);
            ret.push({ name: row[1], num: total });
        }
        return ret;
    }
    catch (err) {
        console.log("Unable to parse names: \n" + err);
        return null;
    }
}

axios.get('https://jsonplaceholder.typicode.com/users').then(res => {
    const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
    console.log('Status Code:', res.status);
    console.log('Date in Response header:', headerDate);

    const users = res.data;
    console.log(users);
    /*for(let user of users) {
        console.log(`Got user with id: ${user.id}, name: ${user.name}`);
    }*/
});