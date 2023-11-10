const fs = require("fs");
const path = require("path");
const express = require("express");
const { MediaStore } = require("../store");
const { all } = require("express/lib/application");
const app = express();
const mediaStore = new MediaStore();

app.use(express.json());

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
			const data = JSON.parse(row);
			data.forEach(deadMedia => {
				if (!checkIfValidDeadMedia(deadMedia)) {
					console.log("Invalid JSON");
				} else {
					mediaStore
						.create(deadMedia.name, deadMedia.type, deadMedia.desc)
						.then(id => console.log(`Saved media object ${id}`));
				}
			});
		} catch (e) {
			console.log(e);
		}
	});
};

parseAndValidateFile(DEADMEDIA_PATH);

// TODO: test all endpoint, test that the status code actually work.


app.get("/media", async (req, res) => {
	const allMedia = await mediaStore.retrieveAll();
	allMedia.forEach(media => {
		const originalId = media.id;
		media.id = `/media/${originalId}`;
	});
	if (allMedia.length > 0) {
		return res.status(200).json(allMedia);
	} else if (allMedia.length === 0) {
		return res.status(204).json(allMedia);
	} else {
		return res.status(500);
	}
});

app.get("/media/:id", async (req, res) => {
	const requiredId = req.params.id;
	const mediaObj = await mediaStore.retrieve(parseInt(requiredId));
	if (mediaObj) {
		res.status(200).json(mediaObj);
	} else if (mediaObj === undefined) {
		res.status(404);
	} else {
		res.status(500);
	}
})

app.listen(PORT, () => {
	console.log(`http://localhost:${PORT}`);
});
