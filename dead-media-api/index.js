const fs = require("fs");
const path = require("path");
const express = require("express");
const { MediaStore } = require("../store");
const app = express();

const PORT = 4000;
const DEADMEDIA_PATH = process.argv[2];

const checkIfValidDeadMedia = ({ name, type, desc }) => {
	const legalTypes = ["TAPE", "CD", "DVD"];
	return name.length < 40 && legalTypes.includes(type) && desc.length < 200;
};

// TODO: wrap around try catch block if file doesn't exist.
// TODO: test this functionL if file doesn't exist or if JSON is invalid
const parseAndValidateFile = filePath => {
	fs.createReadStream(path.join(__dirname, filePath)).on("data", row => {
		try {
			const mediaStore = new MediaStore();
			const data = JSON.parse(row);
			data.forEach(deadMedia => {
				if (!checkIfValidDeadMedia(deadMedia)) {
					console.log("Invalid JSON");
				} else {
					mediaStore.create(
						deadMedia.name,
						deadMedia.type,
						deadMedia.desc
					).then(id => console.log(id));
				}
			});
		} catch (e) {
			console.log(e);
		}
	});
};

parseAndValidateFile(DEADMEDIA_PATH);

app.get("/", (req, res) => {
	res.send("hello world");
});

app.listen(PORT, () => {
	console.log(`http://localhost:${PORT}`);
});
