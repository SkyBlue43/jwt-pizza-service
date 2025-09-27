const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

let adminUser;
let testAdminAuthToken;
const franchise = {
  name: randomName(),
  admins: [{ email: "f@jwt.com", id: 4, name: "pizza franchisee" }],
};
let franchiseID;
const store = {
  name: "Test Store",
};
let storeId;

beforeAll(async () => {
  adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  testAdminAuthToken = loginRes.body.token;
  expectValidJwt(testAdminAuthToken);
});

test("create franchise", async () => {
  const franchiseRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${testAdminAuthToken}`)
    .send(franchise);

  expect(franchiseRes.status).toBe(200);
  expect(franchiseRes.body).toEqual({
    name: expect.any(String),
    admins: [
      {
        email: "f@jwt.com",
        id: expect.any(Number),
        name: "pizza franchisee",
      },
    ],
    id: expect.any(Number),
  });

  ({ id: franchiseID } = franchiseRes.body);
});

test("create store", async () => {
  const storeRes = await request(app)
    .post(`/api/franchise/${franchiseID}/store`)
    .set("Authorization", `Bearer ${testAdminAuthToken}`)
    .send(store);
  expect(storeRes.status).toBe(200);
  expect(storeRes.body).toEqual({
    franchiseId: franchiseID,
    id: expect.any(Number),
    name: "Test Store",
  });
  ({ id: storeId } = storeRes.body);
});

test("delete store", async () => {
  const storeRes = await request(app)
    .delete(`/api/franchise/${franchiseID}/store/${storeId}`)
    .set("Authorization", `Bearer ${testAdminAuthToken}`);

  expect(storeRes.status).toBe(200);
  expect(storeRes.body).toEqual({ message: "store deleted" });
});

test("delete franchise", async () => {
  const franchiseRes = await request(app)
    .delete(`/api/franchise/${franchiseID}`) // no colon here
    .set("Authorization", `Bearer ${testAdminAuthToken}`);

  expect(franchiseRes.status).toBe(200);
  expect(franchiseRes.body).toEqual({ message: "franchise deleted" });
});

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
}

test("can't access because I'm a user", async () => {
  const testUser = {
    name: "pizza diner",
    email: "reg@test.com",
    password: "a",
  };

  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  expectValidJwt(testUserAuthToken);

  const storeRes = await request(app)
    .post(`/api/franchise/${franchiseID}/store`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(store);
  expect(storeRes.status).toBe(403);

  const franchiseRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(franchise);
  expect(franchiseRes.status).toBe(403);

  const store2Res = await request(app)
    .delete(`/api/franchise/${franchiseID}/store/${storeId}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(store2Res.status).toBe(403);
});

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  user = await DB.addUser(user);
  return { ...user, password: "toomanysecrets" };
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}
