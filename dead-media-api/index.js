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
	console.log("here");
	let { name, type, desc, limit, offset } = req.query;
	const queryName = !!name;
	const queryType = !!type;
	const queryDesc = !!desc;
	console.log(name, type, desc);

	const result = [];
	if (limit && offset) {
		limit = parseInt(limit);
		offset = parseInt(offset);
		for (let x = offset; x < offset + limit; x++) {
			try {
				let valid = false;
				const mediaObj = await mediaStore.retrieve(x);
				const values = Object.values(mediaObj);
				console.log(values, "---");
				console.log(values.includes(name));

				// if (queryName) valid = values.includes(name);
				valid = queryName ? values.includes(name) : valid;
				valid = queryType ? values.includes(type) : valid;
				valid = queryDesc ? values.includes(desc) : valid;
				// if (queryType) valid = values.includes(type);
				// if (queryDesc) valid = values.includes(desc);

				valid
					? result.push({
							...(await mediaStore.retrieve(x)),
							id: `/media/${x}`
					  })
					: {};
			} catch (e) {
				return res.status(404).json({ error: "here" });
			}
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
	if (result.length > 0) {
		return res.status(200).json(result);
	} else if (result.length === 0) {
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
