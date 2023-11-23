const supertest = require("supertest");
const { startApp } = require("./index");
const MediaStore = require("./store.js").MediaStore;
const mediaStore = new MediaStore(true);

describe("GET /media", () => {
	it("should return a 500 without any query parameters.", async () => {
		const res = await supertest(startApp(mediaStore)).get("/media");
		expect(res.statusCode).toBe(500);
	});
	it("should return a 500 with query parameters", async () => {
		const res = await supertest(startApp(mediaStore)).get(
			"/media?limit=30&offset=2"
		);
		expect(res.statusCode).toBe(500);
	});
});

describe("POST /media", () => {
	it("should return a 500", async () => {
		const res = await supertest(startApp(mediaStore)).post("/media");
		expect(res.statusCode).toBe(500);
	});
});

describe("PUT /media", () => {
	it("should return a 500", async () => {
		const newMediaObj = {
			name: "Pulp Fiction",
			type: "CD",
			desc: "Quentin Tarantino's cult classic crime film."
		};
		const res = await supertest(startApp(mediaStore)).put("/media/4").send(newMediaObj);
		expect(res.statusCode).toBe(500);
	});
});

describe("DELETE /media/id", () => {
	it("should return a 500", async() => {
		const res = await supertest(startApp(mediaStore)).delete("/media/4");
		expect(res.statusCode).toBe(500);
	});
});
