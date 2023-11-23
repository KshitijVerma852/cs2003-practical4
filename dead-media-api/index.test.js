const supertest = require("supertest");
const { server, startApp, parseAndValidateFile } = require("./index");
const MediaStore = require("./store.js").MediaStore;
const mediaStore = new MediaStore();

beforeAll(async () => {
	await parseAndValidateFile("data/deadmedia.json", mediaStore);
});

describe("GET /media", () => {
	it("should be able to call the endpoint.", async () => {
		const res = await supertest(startApp(mediaStore)).get("/media");
		await expect(res.statusCode).toBe(200);
	});
	describe("Pagination", () => {
		it("should be paginated when offset is 0.", async () => {
			const res = await supertest(startApp(mediaStore)).get(
				"/media?limit=20&offset=0"
			);
			await expect(res.statusCode).toBe(200);
			await expect(res.body.results.length).toEqual(20);
		});
		it("should work normally.", async () => {
			const res = await supertest(startApp(mediaStore)).get(
				"/media?limit=5&offset=2"
			);
			expect(res.statusCode).toBe(200);
			expect(res.body.results.length).toBe(5);
		});
		it("should return null for previous when offset is 0.", async () => {
			const res = await supertest(startApp(mediaStore)).get(
				"/media?offset=0"
			);
			await expect(res.statusCode).toBe(200);
			expect(res.body.previous).toEqual(null);
		});
		it("should return null for next if the limit is too high.", async () => {
			const res = await supertest(startApp(mediaStore)).get(
				"/media?limit=30"
			);
			expect(res.body.next).toEqual(null);
		});
		it("should return a 204 when result is empty", async () => {
			const res = await supertest(startApp(mediaStore)).get(
				"/media?type=DVA"
			);
			expect(res.statusCode).toBe(204);
		});
	});
	describe("Querying", () => {
		it("should return all the movies of type 'DVD'.", async () => {
			const res = await supertest(startApp(mediaStore)).get(
				"/media?type=DVD"
			);
			res.body.results.forEach(mediaObj => {
				expect(mediaObj.type).toBe("DVD");
			});
		});
		it("should return a specific movie by name.", async () => {
			const res = await supertest(startApp(mediaStore)).get(
				"/media?name=Pulp Fiction"
			);
			expect(res.statusCode).toBe(200);
			expect(res.body.results[0].name).toBe("Pulp Fiction");
		});
		it("should be able to return the movie from a partial description", async () => {
			const res = await supertest(startApp(mediaStore)).get(
				"/media?desc=Quentin Tarantino's"
			);
			expect(res.statusCode).toBe(200);
			expect(res.body.results[0].name).toBe("Pulp Fiction");
		});
	});
	describe("/id", () => {
		it("should return a specific movie by using the id as a parameter.", async () => {
			const res = await supertest(startApp(mediaStore)).get("/media/1");
			expect(res.statusCode).toBe(200);
			expect(res.body.name).toBe("Pulp Fiction");
		});
		it("should return a 404 if movie doesn't exist.", async () => {
			const res = await supertest(startApp(mediaStore)).get("/media/100");
			expect(res.statusCode).toBe(404);
		});
	});
});

describe("POST /media", () => {
	it("should accept new data and save it.", async () => {
		const newMedia = {
			name: "Pulp Fiction",
			type: "CD",
			desc: "Quentin Tarantino's cult classic crime film."
		};
		await supertest(startApp(mediaStore)).post("/media").send(newMedia);

		expect(
			(await supertest(startApp(mediaStore)).get("/media/20")).body
		).toEqual({
			...newMedia,
			id: "/media/20"
		});
	});
	it("should return a 201 when created", async () => {
		const newMedia = {
			name: "Cool movie",
			type: "DVD",
			desc: "Very very cool movie."
		};
		const res = await supertest(startApp(mediaStore))
			.post("/media")
			.send(newMedia);
		expect(res.statusCode).toBe(201);
	});
});

describe("PUT /media/id", () => {
	it("should update the media object in the store", async () => {
		const newMediaObj = {
			name: "Pulp Fiction",
			type: "CD",
			desc: "Quentin Tarantino's cult classic crime film."
		};
		await supertest(startApp(mediaStore)).put("/media/1").send(newMediaObj);
		expect(
			(await supertest(startApp(mediaStore)).get("/media/1")).body
		).toEqual({
			...newMediaObj,
			id: "/media/1"
		});
	});
	it("should return a 200 if successfull", async () => {
		const newMediaObj = {
			name: "Pulp Fiction",
			type: "CD",
			desc: "Quentin Tarantino's cult classic crime film."
		};
		const res = await supertest(startApp(mediaStore))
			.put("/media/3")
			.send(newMediaObj);
		expect(res.statusCode).toBe(200);
	});
	it("should return a 400 with incorrect input data", async () => {
		const newMediaObj = {
			name: "Pulp Fiction",
			type: "CDC",
			desc: "Quentin Tarantino's cult classic crime film."
		};
		const res = await supertest(startApp(mediaStore))
			.put("/media/3")
			.send(newMediaObj);
		expect(res.statusCode).toBe(400);
	});
});

describe("DELETE /media/id", () => {
	it("should delete the media object with the specified id.", async () => {
		await supertest(startApp(mediaStore)).delete("/media/1");
		expect(
			(await supertest(startApp(mediaStore)).get("/media/1")).statusCode
		).toBe(404);
	});
	it("should return a 404 if movie doesn't exist", async () => {
		const res = await supertest(startApp(mediaStore)).delete("/media/100");
		expect(res.statusCode).toBe(404);
	});
});

afterAll(() => {
	server(mediaStore).close();
});
