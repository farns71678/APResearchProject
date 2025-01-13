const express = require('express');
const app = express();
const port = 3000;

console.log(randomBirthDate());

app.get("/", (req, res) => {
    res.send("Random User: " + randomBirthDate());
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