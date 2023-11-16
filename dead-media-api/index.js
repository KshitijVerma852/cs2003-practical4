const fs = require("fs");
const path = require("path");
const express = require("express");
const {MediaStore} = require("./store");
const app = express();
const mediaStore = new MediaStore();

app.use(express.json());

const PORT = 4000;
const DEADMEDIA_PATH = process.argv[2];

const checkIfValidDeadMedia = ({name, type, desc}) => {
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
	const result = [];
	allMedia.forEach(media => {
		result.push({
			...media,
			id: `/media/${media.id}`
		});
	});
	if (allMedia.length > 0) {
		return res.status(200).json(result);
	} else if (allMedia.length === 0) {
		return res.status(204).json(result);
	} else {
		return res.status(500);
	}
});

app.get("/media/:id", async (req, res) => {
	const requiredId = req.params.id;
	try {
		const mediaObj = {
			...(await mediaStore.retrieve(parseInt(requiredId)))
		};
		mediaObj.id = `/media/${requiredId}`;
		if (mediaObj) {
			res.status(200).json(mediaObj);
		}
	} catch (e) {
		res.status(404).json({error: "Not found"});
	}
});

// TODO: Add tests to this. Check if the object actually is created or not, POST to this endpoint first then use the GET by id endpoint to check.
app.post("/media", async (req, res) => {
	const {name, type, desc} = req.body;
	await mediaStore.create(name, type, desc);
	return res.status(201).json({success: true});
});

// TODO: Add tests to this. Check if the object actually is created or not, POST to this endpoint first then use the GET by id endpoint to check.
// TODO: Not tested at all, should work hopefully.
app.put("/media/:id", async (req, res) => {
	const {name, type, desc} = req.body;
	await mediaStore.update(req.params.id, name, type, desc);
	return res.status(200).json({success: true});
});

// TODO: Add tests to this. Check if the object actually is created or not, POST to this endpoint first then use the GET by id endpoint to check.
// TODO: Not tested at all, should work hopefully.
app.delete("/media/:id", async (req, res) => {
	try {
		const media = await mediaStore.retrieve(parseInt(req.params.id));
		try {
			await mediaStore.delete(req.params.id);
			res.status(204).json({success: true})
		} catch (e) {
			res.status(500);
		}
	} catch (e) {
		res.status(404).json({error: e})
	}
})

app.listen(PORT, () => {
	console.log(`http://localhost:${PORT}`);
});
