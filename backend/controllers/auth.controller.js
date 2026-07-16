const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, admin } = require("../config/firebase");

const usersCol = db.collection("users");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

module.exports = { register, login, me };
