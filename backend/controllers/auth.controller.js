const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db, admin } = require("../config/firebase");
const { sendPasswordResetEmail } = require("../config/mailer");

const usersCol = db.collection("users");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await usersCol.where("email", "==", normalizedEmail).limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const docRef = await usersCol.add({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const user = { id: docRef.id, name: name.trim(), email: normalizedEmail };
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Something went wrong while creating your account", detail: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const snap = await usersCol.where("email", "==", normalizedEmail).limit(1).get();
    if (snap.empty) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const match = await bcrypt.compare(password, data.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = { id: doc.id, name: data.name, email: data.email };
    const token = signToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Something went wrong while signing you in", detail: err.message });
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const snap = await usersCol.where("email", "==", normalizedEmail).limit(1).get();

    // Always respond the same way whether or not the account exists, so the
    // endpoint can't be used to enumerate registered emails.
    const genericResponse = {
      message: "If an account exists for that email, a reset link has been sent.",
    };

    if (snap.empty) {
      return res.json(genericResponse);
    }

    const doc = snap.docs[0];
    const data = doc.data();

    const rawToken = crypto.randomBytes(32).toString("hex");
    await doc.ref.update({
      resetTokenHash: hashToken(rawToken),
      resetTokenExpiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const clientUrl = (process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0].trim();
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    const { delivered } = await sendPasswordResetEmail({ to: data.email, name: data.name, resetUrl });

    const payload = { ...genericResponse };
    // No email provider configured (local/dev) — surface the link directly
    // in non-production so the flow stays testable end-to-end.
    if (!delivered && process.env.NODE_ENV !== "production") {
      payload.devResetUrl = resetUrl;
    }

    res.json(payload);
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: "Something went wrong. Please try again.", detail: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const tokenHash = hashToken(token);
    const snap = await usersCol.where("resetTokenHash", "==", tokenHash).limit(1).get();
    if (snap.empty) {
      return res.status(400).json({ message: "This reset link is invalid or has already been used" });
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const expiresAt = data.resetTokenExpiresAt ? data.resetTokenExpiresAt.toMillis() : 0;
    if (Date.now() > expiresAt) {
      return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await doc.ref.update({
      passwordHash,
      resetTokenHash: admin.firestore.FieldValue.delete(),
      resetTokenExpiresAt: admin.firestore.FieldValue.delete(),
    });

    res.json({ message: "Password updated. You can now sign in with your new password." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Something went wrong. Please try again.", detail: err.message });
  }
}

module.exports = { register, login, me, forgotPassword, resetPassword };
