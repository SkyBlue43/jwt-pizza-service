const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

const testUser = {
  name: "pizza diner",
  email: "reg@test.com",
  password: "a",
};
let adminUser, testAdminAuthToken, testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  expectValidJwt(testUserAuthToken);
});

test("get user", async () => {
  const userRes = await request(app)
    .get("/api/user/me")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(userRes.status).toBe(200);
});

test("update user", async () => {
  adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  testAdminAuthToken = loginRes.body.token;
  expectValidJwt(testAdminAuthToken);
  const userRes = await request(app)
    .put(`/api/user/1`)
    .set("Authorization", `Bearer ${testAdminAuthToken}`)
    .send(testUser);
  expect(userRes.status).toBe(200);
});

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
}

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  user = await DB.addUser(user);
  return { ...user, password: "toomanysecrets" };
}

test("list users unauthorized", async () => {
  const listUsersRes = await request(app).get("/api/user");
  expect(listUsersRes.status).toBe(401);
});

test("list users", async () => {
  const [user, userToken] = await registerUser(request(app));
  const listUsersRes = await request(app)
    .get("/api/user")
    .set("Authorization", "Bearer " + userToken);
  expect(listUsersRes.status).toBe(200);
});

test("delete users", async () => {
  const [user, userToken] = await registerUser(request(app));
  const deleteRes = await request(app)
    .delete(`/api/user/${user.id}`)
    .set("Authorization", "Bearer " + userToken);
  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body).toEqual({ message: "user deleted" });
});

async function registerUser(service) {
  const testUser = await createAdminUser();
  // Instead of posting again to /api/auth, just login
  const loginRes = await service.put("/api/auth").send({
    email: testUser.email,
    password: testUser.password,
  });

  return [testUser, loginRes.body.token];
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}
