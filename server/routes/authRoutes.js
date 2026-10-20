const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Helper to create application JWT
const generateAppToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ==========================================
// 1. REGISTER (Local email/password)
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    const trimmedEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email: trimmedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user - Role is strictly enforced as "user"
    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      role: "user",
      authProvider: "local",
      loginHistory: [
        {
          email: trimmedEmail,
          provider: "local",
          loginAt: new Date(),
        },
      ],
    });

    const token = generateAppToken(user);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        role: user.role,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({
      message: "Something went wrong while creating the account.",
    });
  }
});

// ==========================================
// 2. LOGIN (Local email/password)
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const trimmedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.isDeactivated) {
      return res.status(403).json({
        message: "This account has been deactivated. Please contact an administrator.",
      });
    }

    // Check if account has a password set (accounts registered solely with Google might not have a password yet)
    if (!user.password) {
      return res.status(400).json({
        message: "This account was created using Google Sign-In. Please click 'Continue with Google'.",
        suggestGoogle: true,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Record login in user's login history
    const loginEntry = {
      email: user.email,
      provider: "local",
      loginAt: new Date(),
    };
    user.loginHistory = [loginEntry, ...(user.loginHistory || [])].slice(0, 15);
    user.lastActivityAt = new Date();
    await user.save();

    const token = generateAppToken(user);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        role: user.role || "user",
        authProvider: user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Something went wrong while logging in.",
    });
  }
});

// ==========================================
// 3. GOOGLE SIGN-IN & SIGNUP
// ==========================================
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential token is required.",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(503).json({
        message: "Google authentication is not configured on this server. Please configure GOOGLE_CLIENT_ID.",
        notConfigured: true,
      });
    }

    const client = new OAuth2Client(clientId);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
    } catch (verifyError) {
      console.error("Google token verification failed:", verifyError.message);
      return res.status(401).json({
        message: "Google token verification failed: " + verifyError.message,
      });
    }

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      return res.status(400).json({
        message: "Invalid Google token payload.",
      });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || "Google User";
    const avatar = payload.picture || "";
    const emailVerified = payload.email_verified;

    if (!emailVerified) {
      return res.status(403).json({
        message: "Google email address is not verified. Please verify your Google account first.",
      });
    }

    // 1. Check if user with this googleId already exists
    let user = await User.findOne({ googleId });

    if (user) {
      if (user.isDeactivated) {
        return res.status(403).json({
          message: "This account has been deactivated. Please contact an administrator.",
        });
      }

      // Record login
      const loginEntry = {
        email: user.email,
        provider: "google",
        loginAt: new Date(),
      };
      user.loginHistory = [loginEntry, ...(user.loginHistory || [])].slice(0, 15);
      user.lastActivityAt = new Date();
      if (!user.avatar && avatar) {
        user.avatar = avatar;
      }
      await user.save();

      const token = generateAppToken(user);

      return res.status(200).json({
        message: "Google login successful.",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || "",
          role: user.role || "user",
          authProvider: user.authProvider || "google",
        },
      });
    }

    // 2. Check if a user with the same email already exists (security audit: no automatic silent linking)
    const existingEmailUser = await User.findOne({ email });

    if (existingEmailUser) {
      if (existingEmailUser.isDeactivated) {
        return res.status(403).json({
          message: "This account has been deactivated. Please contact an administrator.",
        });
      }

      // Existing user has a password and no googleId linked yet.
      // Require explicit password verification before linking to prevent account hijacking.
      return res.status(409).json({
        message: "An existing password account uses this email. Please enter your password to link your Google account.",
        requiresLinking: true,
        email: existingEmailUser.email,
      });
    }

    // 3. Brand new user - Register with role "user"
    user = await User.create({
      name: name.trim(),
      email,
      googleId,
      authProvider: "google",
      avatar,
      role: "user",
      loginHistory: [
        {
          email,
          provider: "google",
          loginAt: new Date(),
        },
      ],
      lastActivityAt: new Date(),
    });

    const token = generateAppToken(user);

    return res.status(201).json({
      message: "Google registration successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        role: user.role,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("Google auth route error:", error.message);
    res.status(500).json({
      message: "Something went wrong during Google authentication.",
    });
  }
});

// ==========================================
// 4. SECURE GOOGLE ACCOUNT LINKING
// ==========================================
router.post("/google/link", async (req, res) => {
  try {
    const { credential, password } = req.body;

    if (!credential || !password) {
      return res.status(400).json({
        message: "Google credential and existing account password are required.",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({
        message: "Google authentication is not configured on this server.",
      });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return res.status(400).json({
        message: "Invalid Google credential.",
      });
    }

    const email = payload.email.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No existing account found with this email.",
      });
    }

    if (user.isDeactivated) {
      return res.status(403).json({
        message: "This account has been deactivated. Please contact an administrator.",
      });
    }

    // Verify existing password to guarantee authorized account owner initiated linking
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Password verification failed. Incorrect password.",
      });
    }

    // Link Google ID safely
    user.googleId = payload.sub;
    if (!user.avatar && payload.picture) {
      user.avatar = payload.picture;
    }

    const loginEntry = {
      email: user.email,
      provider: "google",
      loginAt: new Date(),
    };
    user.loginHistory = [loginEntry, ...(user.loginHistory || [])].slice(0, 15);
    user.lastActivityAt = new Date();
    await user.save();

    const token = generateAppToken(user);

    res.status(200).json({
      message: "Google account successfully linked.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        role: user.role || "user",
        authProvider: user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Google link error:", error.message);
    res.status(500).json({
      message: "Something went wrong while linking Google account.",
    });
  }
});

// ==========================================
// 5. GET CURRENT USER PROFILE
// ==========================================
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
        role: user.role || "user",
        authProvider: user.authProvider || "local",
        isGoogleLinked: Boolean(user.googleId),
        hasPassword: Boolean(user.password),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error.message);
    res.status(500).json({
      message: "Something went wrong while fetching user profile.",
    });
  }
});

// ==========================================
// 6. UPDATE PROFILE NAME
// ==========================================
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
        role: user.role || "user",
        authProvider: user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({
      message: "Something went wrong while updating profile.",
    });
  }
});

// ==========================================
// 7. CHANGE OR SET PASSWORD
// ==========================================
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
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

    // If user already has a password, verify current password
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required to change password.",
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

// ==========================================
// 8. UPDATE EMAIL (Requires password verification)
// ==========================================
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
    if (!user.password) {
      return res.status(400).json({
        message: "Please set a password on your account before changing email.",
      });
    }

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
        role: user.role || "user",
        authProvider: user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Update email error:", error.message);
    res.status(500).json({
      message: "Something went wrong while updating email.",
    });
  }
});

// ==========================================
// 9. UPLOAD / UPDATE PROFILE AVATAR
// ==========================================
router.put("/profile/avatar", authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar || typeof avatar !== "string") {
      return res.status(400).json({
        message: "Avatar image data is required.",
      });
    }

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
        role: user.role || "user",
        authProvider: user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Update avatar error:", error.message);
    res.status(500).json({
      message: "Something went wrong while updating profile picture.",
    });
  }
});

// ==========================================
// 10. REMOVE PROFILE AVATAR
// ==========================================
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
        role: user.role || "user",
        authProvider: user.authProvider || "local",
      },
    });
  } catch (error) {
    console.error("Remove avatar error:", error.message);
    res.status(500).json({
      message: "Something went wrong while removing profile picture.",
    });
  }
});

// ==========================================
// 11. GET LOGIN HISTORY
// ==========================================
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