const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;
const DEADMEDIA_PATH = process.argv[2];

console.log(DEADMEDIA_PATH);

fs.createReadStream(path.join(DEADMEDIA_PATH))
	.on("data", row => {
		console.log(row);
	})

app.listen(PORT, () => {
	console.log(`http://localhost:${3000}`);
});
