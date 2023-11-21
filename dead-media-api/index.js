const fs = require("fs");
const path = require("path");
const express = require("express");
const { MediaStore } = require("./store");
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
			data.forEach(async ({ name, type, desc }) => {
				if (!checkIfValidDeadMedia({ name, type, desc })) {
					console.log("Invalid JSON");
				} else {
					await mediaStore.create(name, type, desc);
				}
			});
		} catch (e) {
			console.log(e);
		}
	});
};

parseAndValidateFile(DEADMEDIA_PATH);

// TODO: test all endpoints, test that the status code actually work.

app.get("/media", async (req, res) => {
	let { name, type, desc, limit, offset } = req.query;
	const queryName = !!name;
	const queryType = !!type;
	const queryDesc = !!desc;
	const queries = queryName || queryType || queryDesc;

	const result = [];

	if (limit && offset) {
		limit = parseInt(limit);
		offset = parseInt(offset);
		for (let x = offset; x < offset + limit; x++) {
			let mediaObj = {};
			try {
				mediaObj = await mediaStore.retrieve(x);
			} catch (e) {}
			result.push({
				...mediaObj,
				id: `/media/${x}`
			});
		}
	} else {
		const allMedia = await mediaStore.retrieveAll();
		allMedia.forEach(media => {
			result.push({
				...media,
				id: `/media/${media.id}`
			});
		});
	}
	let valid = true;
	let finalResults = [];

	if (queries) {
		result.forEach(mediaObj => {
			const values = Object.values(mediaObj);
			if (queryName && valid) valid = values.includes(name);
			if (queryType && valid) valid = values.includes(type);
			if (queryDesc && valid) valid = values.includes(desc);

			valid ? finalResults.push(mediaObj) : null;
			valid = true;
		});
	} else {
		finalResults = result;
	}

	if (finalResults.length > 0) {
		return res.status(200).json(finalResults);
	} else if (finalResults.length === 0) {
		return res.status(204).json(finalResults);
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
		res.status(404).json({ error: "Not found" });
	}
});

// TODO: Add tests to this. Check if the object actually is created or not, POST to this endpoint first then use the GET by id endpoint to check.
app.post("/media", async (req, res) => {
	const { name, type, desc } = req.body;
	await mediaStore.create(name, type, desc);
	return res.status(201).json({ success: true });
});

// TODO: Add tests to this. Check if the object actually is created or not, POST to this endpoint first then use the GET by id endpoint to check.
// TODO: Check how to receive data, currently doing it through request headers.
app.put("/media/:id", async (req, res) => {
	const { name, type, desc } = req.body;
	await mediaStore.update(req.params.id, name, type, desc);
	return res.status(200).json({ success: true });
});

// TODO: Add tests to this. Check if the object actually is created or not, POST to this endpoint first then use the GET by id endpoint to check.
// TODO: Not tested at all, should work hopefully.
app.delete("/media/:id", async (req, res) => {
	try {
		const media = await mediaStore.retrieve(parseInt(req.params.id));
		try {
			await mediaStore.delete(req.params.id);
			res.status(204).json({ success: true });
		} catch (e) {
			res.status(500);
		}
	} catch (e) {
		res.status(404).json({ error: e });
	}
});

app.listen(PORT, () => {
	console.log(`http://localhost:${PORT}`);
});
