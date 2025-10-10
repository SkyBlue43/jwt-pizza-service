// node
const { Role, DB } = require("../database/database.js");

async function createAdminUser() {
  let user = {
    password: "admin",
    roles: [{ role: Role.Admin }],
  };

  user.name = "常用名字";
  user.email = "a@jwt.com";

  user = await DB.addUser(user);

  return { ...user, password: "admin" };
}

createAdminUser()
  .then((user) => {
    console.log("✅ Admin inserted:", user.email);
    console.log("Login password:", user.password);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Failed to create admin:", err);
    process.exit(1);
  });
