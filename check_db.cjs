const mongoose = require("mongoose");
require("dotenv").config({ path: "server/.env" });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await mongoose.connection.collection("users").find({ email: /testauth/i }).toArray();
  console.log("Found users:");
  users.forEach(u => console.log(u.email, u.name, "has password:", !!u.password));
  process.exit(0);
});
