const fs = require("fs");
const path = require("path");
const express = require("express");
const axios = require("axios");

const PORT = 24751;
const DEADMEDIA_PATH = process.argv[2];

/**
 * Checks if a movie object is valid or not
 * @param name of the movie
 * @param type of the movie
 * @param desc of the movie
 * @returns {boolean} valid or not.
 */
const checkIfValidDeadMedia = ({ name, type, desc }) => {
	const legalTypes = ["TAPE", "CD", "DVD"];
	return name.length < 40 && legalTypes.includes(type) && desc.length < 200;
};

/**
 * Parses the JSON file and saves the movies to the store
 * @param filePath the bath of the file to be parsed.
 * @param mediaStore the store movies are to be saved to.
 * @returns {Promise<void>}
 */
const parseAndValidateFile = async (filePath, mediaStore) => {
	await fs
		.createReadStream(path.join(__dirname, filePath))
		.on("data", async row => {
			try {
				const data = JSON.parse(row);
				for (let x = 0; x < data.length; x++) {
					checkIfValidDeadMedia(data[x])
						? await mediaStore.create(
								data[x].name,
								data[x].type,
								data[x].desc
						  )
						: null;
				}
			} catch (e) {
				console.log(e);
			}
		});
};

/**
 * Main execution point declares all endpoints and behaviour for the app.
 * @param mediaStore the store from where to read and write data.
 * @returns {*|Express} the app.
 */
const startApp = mediaStore => {
	const app = express();

	app.use(express.json());
	app.get("/media", async (req, res) => {
		// Destructuring off the properties from the request.
		let { name, type, desc, limit, offset } = req.query;
		const queryName = !!name;
		const queryType = !!type;
		const queryDesc = !!desc;
		const queries = queryName || queryType || queryDesc;
		offset = offset ? offset : 0; // Setting a value for offset.

		// Structure of response.
		const result = [];
		const answer = {
			count: 0,
			previous: "",
			next: "",
			results: []
		};

		if (limit && offset) {
			limit = parseInt(limit);
			offset = parseInt(offset);
			// Loop through manually to get each movie.
			for (let x = offset; x < offset + limit; x++) {
				let add = false;
				let mediaObj = {};
				try {
					mediaObj = await mediaStore.retrieve(x);
					add = true;
				} catch (e) {
					return res.status(500).send();
				}
				add
					? result.push({
							...mediaObj,
							id: `/media/${x}`
					  })
					: null;
			}
		} else {
			// Get all movies as no limit or offset.
			let allMedia;
			try {
				allMedia = await mediaStore.retrieveAll();
			} catch (e) {
				return res.status(500).send();
			}

			allMedia.forEach(media => {
				result.push({
					...media,
					id: `/media/${media.id}`
				});
			});
		}
		let valid = true;
		let finalResults = [];

		// Filter out depending on queries.
		if (queries) {
			result.forEach(mediaObj => {
				const values = Object.values(mediaObj);
				if (queryName && valid) valid = values.includes(name);
				if (queryType && valid) valid = values.includes(type);
				if (queryDesc && valid) valid = values[3].includes(desc);

				valid ? finalResults.push(mediaObj) : null;
				valid = true;
			});
		} else {
			finalResults = result;
		}

		answer.results = finalResults;
		answer.count = finalResults.length;

		// Determine the values for previous and next.
		let prevObj;
		let nextObj;
		try {
			prevObj = (await mediaStore.retrieve(offset - 1)).id;
		} catch (e) {
			prevObj = null;
		}

		try {
			nextObj = (await mediaStore.retrieve(offset + limit + 1)).id;
		} catch (e) {
			nextObj = null;
		}

		answer.previous =
			offset - 1 < 0 || !prevObj ? null : `/media/${prevObj}`;
		answer.next =
			offset + limit > (await mediaStore.retrieveAll()).length || !nextObj
				? null
				: `/media/${nextObj}`;

		// Sending the data back to the user.
		if (finalResults.length > 0) {
			return res.status(200).json(answer);
		} else if (finalResults.length === 0) {
			return res.status(204).json(answer);
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
				return res.status(200).json(mediaObj);
			}
		} catch (e) {
			return res.status(404).send();
		}
	});

	app.post("/media", async (req, res) => {
		const { name, type, desc } = req.body;
		try {
			await mediaStore.create(name, type, desc);
		} catch (e) {
			return res.status(500).send();
		}
		return res.status(201).send();
	});

	app.put("/media/:id", async (req, res) => {
		if (checkIfValidDeadMedia(req.body)) {
			const { name, type, desc } = req.body;
			try {
				await mediaStore.update(req.params.id, name, type, desc);
			} catch (e) {
				return res.status(500).send();
			}
			return res.status(200).send();
		} else {
			return res.status(400).send();
		}
	});

	app.delete("/media/:id", async (req, res) => {
		let movieObj;
		// Check if the movie exists or not.
		try {
			movieObj = await mediaStore.retrieve(parseInt(req.params.id));
		} catch (e) {
			if (e.includes("Error: cannot find media with ID:")) {
				return res.status(404).send();
			} else {
				return res.status(500).send();
			}
		}
		if (movieObj) {
			await mediaStore.delete(parseInt(req.params.id));
			return res.status(204).send();
		}
	});

	/**
	 * Determines if a transfer is valid or not.
	 * @param source the local address.
	 * @param target the remote address.
	 * @returns {*} valid or not.
	 */
	const validTransfer = ({ source, target }) => source && target;

	app.post("/transfer", async (req, res) => {
		if (validTransfer(req.body)) {
			const id = parseInt(req.body.source.slice(7));
			const mediaObj = await mediaStore.retrieve(id);
			await axios({
				method: "POST",
				url: req.body.target,
				data: mediaObj
			});
			await mediaStore.delete(id);
		}
	});
	return app;
};

/**
 * The actual server that listens to on all endpoints.
 * @param mediaStore the store to use.
 * @returns {http.Server}
 */
const server = mediaStore =>
	startApp(mediaStore).listen(PORT, () => {
		console.log(`http://localhost:${PORT}`);
	});

module.exports = { startApp, parseAndValidateFile, server };
