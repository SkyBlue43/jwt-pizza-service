// const request = require("supertest");
// const app = require("../service");
// const { Role, DB } = require("../database/database.js");

// const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
// let adminUser;

// const menuItem = {
//   title: "Monster",
//   image: "random.png",
//   price: 2.0,
//   description: "A garden of fright",
// };
// let testUserAuthToken;
// let testAdminAuthToken;

// beforeAll(async () => {
//   testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
//   const registerRes = await request(app).post("/api/auth").send(testUser);
//   testUserAuthToken = registerRes.body.token;
//   expectValidJwt(testUserAuthToken);
// });

// test("add menu item diner", async () => {
//   const menuRes = await request(app)
//     .put("/api/order/menu")
//     .set("Authorization", `Bearer ${testUserAuthToken}`)
//     .send(menuItem);
//   expect(menuRes.status).toBe(403);
// });

// test("order flow", async () => {
//   const {
//     id: adminId,
//     name: adminName,
//     email: adminEmail,
//   } = await createAdminUser();

//   const loginRes = await request(app).put("/api/auth").send({
//     email: adminEmail,
//     password: "toomanysecrets",
//   });
//   const testAdminAuthToken = loginRes.body.token;
//   expectValidJwt(testAdminAuthToken);

//   const franchise = {
//     name: randomName(),
//     admins: [{ email: adminEmail, id: adminId, name: adminName }],
//   };

//   const franchiseRes = await request(app)
//     .post("/api/franchise")
//     .set("Authorization", `Bearer ${testAdminAuthToken}`)
//     .send(franchise);

//   const franchiseId = franchiseRes.body.id;

//   const store = { name: "Test Store" };
//   const storeRes = await request(app)
//     .post(`/api/franchise/${franchiseId}/store`)
//     .set("Authorization", `Bearer ${testAdminAuthToken}`)
//     .send(store);

//   const storeId = storeRes.body.id;

//   const dinerOrder = {
//     franchiseId,
//     storeId,
//     items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
//   };

//   const menuRes = await request(app)
//     .put("/api/order/menu")
//     .set("Authorization", `Bearer ${testAdminAuthToken}`)
//     .send({
//       title: "Monster",
//       image: "random.png",
//       price: 2.0,
//       description: "A garden of fright",
//     });

//   expect(menuRes.status).toBe(200);
//   const lastMenuItem = menuRes.body[menuRes.body.length - 1];
//   expect(lastMenuItem).toEqual({
//     id: expect.any(Number),
//     title: "Monster",
//     image: "random.png",
//     price: 2.0,
//     description: "A garden of fright",
//   });

//   const orderRes = await request(app)
//     .post("/api/order")
//     .set("Authorization", `Bearer ${testUserAuthToken}`)
//     .send(dinerOrder);

//   expect(orderRes.status).toBe(200);
//   expect(orderRes.body.order).toEqual({
//     franchiseId,
//     storeId,
//     items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
//     id: expect.any(Number),
//   });
// });

// test("add menu item", async () => {
//   adminUser = await createAdminUser();
//   const loginRes = await request(app).put("/api/auth").send(adminUser);
//   testAdminAuthToken = loginRes.body.token;
//   expectValidJwt(testAdminAuthToken);

//   const menuRes = await await request(app)
//     .put("/api/order/menu")
//     .set("Authorization", `Bearer ${testAdminAuthToken}`)
//     .send(menuItem);

//   expect(menuRes.status).toBe(200);

//   expect(menuRes.body[menuRes.body.length - 1]).toEqual({
//     id: expect.any(Number),
//     title: "Monster",
//     image: "random.png",
//     price: 2.0,
//     description: "A garden of fright",
//   });
// });

// function expectValidJwt(potentialJwt) {
//   expect(potentialJwt).toMatch(
//     /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
//   );
// }

// async function createAdminUser() {
//   let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
//   user.name = randomName();
//   user.email = user.name + "@admin.com";

//   user = await DB.addUser(user);
//   return { ...user, password: "toomanysecrets" };
// }

// function randomName() {
//   return Math.random().toString(36).substring(2, 12);
// }
