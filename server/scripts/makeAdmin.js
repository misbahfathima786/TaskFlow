/**
 * TaskFlow Administrative Setup CLI Script
 * 
 * Usage:
 *   node server/scripts/makeAdmin.js user@example.com
 *   OR from server directory:
 *   npm run make-admin user@example.com
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load server .env
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const emailArg = process.argv[2];

if (!emailArg) {
  console.error("\n❌ Error: Please provide the user's email address.");
  console.log("Usage: node server/scripts/makeAdmin.js <email>\n");
  process.exit(1);
}

const targetEmail = emailArg.toLowerCase().trim();

if (!process.env.MONGO_URI) {
  console.error("\n❌ Error: MONGO_URI is not defined in server/.env\n");
  process.exit(1);
}

async function elevateAdmin() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.\n");

    const User = require("../models/User");

    const user = await User.findOne({ email: targetEmail });

    if (!user) {
      console.error(`❌ No user account found with email: ${targetEmail}`);
      console.log("Please register an account in TaskFlow first, then run this script to elevate it.\n");
      await mongoose.disconnect();
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`ℹ️ User "${user.name}" (${user.email}) already has the 'admin' role.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    user.role = "admin";
    await user.save();

    console.log("==================================================");
    console.log(`✅ SUCCESS: Elevated "${user.name}" (${user.email}) to Administrator!`);
    console.log("Role: admin");
    console.log("User can now log in and access the Admin Dashboard at /admin");
    console.log("==================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to elevate user:", err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

elevateAdmin();
