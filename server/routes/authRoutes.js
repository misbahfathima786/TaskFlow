const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      message: "Something went wrong while creating the account.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if all fields are provided
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Compare entered password with the hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Record login in user's login history (preserves the original email used at login, capped at 15 entries)
    const loginEntry = {
      email: user.email,
      loginAt: new Date(),
    };
    user.loginHistory = [loginEntry, ...(user.loginHistory || [])].slice(0, 15);
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Something went wrong while logging in.",
    });
  }
});

// GET CURRENT USER PROFILE
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error("Get profile error:", error.message);

    res.status(500).json({
      message: "Something went wrong while fetching user profile.",
    });
  }
});

// UPDATE PROFILE NAME
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.name = name.trim();
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);

    res.status(500).json({
      message: "Something went wrong while updating profile.",
    });
  }
});

// CHANGE PASSWORD
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    res.status(500).json({
      message: "Something went wrong while updating password.",
    });
  }
});

// UPDATE EMAIL (Requires password verification)
router.put("/email", authMiddleware, async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({
        message: "New email and current password are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = newEmail.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Verify current password for re-authentication
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Current password is incorrect. Verification failed.",
      });
    }

    if (user.email === normalizedEmail) {
      return res.status(400).json({
        message: "New email must be different from current email.",
      });
    }

    // Check if new email is already in use by another account
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    user.email = normalizedEmail;
    await user.save();

    res.status(200).json({
      message: "Email updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error("Update email error:", error.message);

    res.status(500).json({
      message: "Something went wrong while updating email.",
    });
  }
});

// UPLOAD / UPDATE PROFILE AVATAR
router.put("/profile/avatar", authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar || typeof avatar !== "string") {
      return res.status(400).json({
        message: "Avatar image data is required.",
      });
    }

    // Validate Base64 Data URL format and MIME type
    const matches = avatar.match(
      /^data:(image\/(jpeg|jpg|png|webp|gif));base64,(.+)$/
    );

    if (!matches) {
      return res.status(400).json({
        message:
          "Invalid image format. Allowed formats are JPEG, PNG, WebP, and GIF.",
      });
    }

    const base64Data = matches[3];
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Enforce 2MB maximum size limit
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
    if (imageBuffer.length > MAX_SIZE_BYTES) {
      return res.status(400).json({
        message: "Image file size exceeds the 2MB limit.",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.avatar = avatar;
    await user.save();

    res.status(200).json({
      message: "Profile picture updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Update avatar error:", error.message);

    res.status(500).json({
      message: "Something went wrong while updating profile picture.",
    });
  }
});

// REMOVE PROFILE AVATAR
router.delete("/profile/avatar", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.avatar = "";
    await user.save();

    res.status(200).json({
      message: "Profile picture removed successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: "",
      },
    });
  } catch (error) {
    console.error("Remove avatar error:", error.message);

    res.status(500).json({
      message: "Something went wrong while removing profile picture.",
    });
  }
});

// GET EMAIL LOGIN HISTORY (Authenticated account owner only)
router.get("/login-history", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("loginHistory");
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      loginHistory: user.loginHistory || [],
    });
  } catch (error) {
    console.error("Get login history error:", error.message);

    res.status(500).json({
      message: "Something went wrong while fetching login history.",
    });
  }
});

module.exports = router;