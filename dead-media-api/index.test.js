const supertest = require("supertest");
const app = require("./index");
const PORT = 24751;

beforeAll(() => {
	app.listen(PORT);
});

describe("R1.1", () => {
	test("Test 1", () => {
		supertest(app).get("/media").expect("Content-Type", /json/).expect(200);
	});
});
