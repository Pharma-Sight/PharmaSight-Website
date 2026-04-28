// controllers/authController.js
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
import { generateToken } from "../utils/jwt.js";
export const register = async (req, res) => {
  const { name, email, password, role, organizationName,organizationtype, healthcaretype, address, country, state, city, pincode } = req.body;
  try {
    // FIX 1: Ensure 'body' is defined or just use the destructured variables
    if (!name || !email || !password || password.length < 6 || !role || !organizationName || !organizationtype || !healthcaretype || !pincode) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // FIX 2: Use res.status().json() instead of Response.json() (standard Express)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Check if org exists
    let organization = await Organization.findOne({
      name: organizationName,
      "location.pincode": pincode
    });

    if (!organization) {
      // FIX 3: Ensure this matches your Schema structure
      organization = await Organization.create({
        name: organizationName,
        type: role, // Ensure 'role' matches your 'type' enum exactly
        healthcaretype : healthcaretype,
        organizationtype : organizationtype,
        location: { country, state, city, pincode, address },
        isVerified: role === "Pharmaceutical Supplier"
      });
    } else {
      // Type matching logic
      if (organization.type !== role) {
        return res.status(400).json({ message: "Organization exists with different type" });
      } 
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // FIX 4: Put User creation AFTER all validation and Org creation
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      organizationId: organization._id
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      organization
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    // FIX 5: Standardize error response
    return res.status(500).json({ message: err.message });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({
    token: generateToken(user),
    user
  });
};


// GET /api/auth/getUser
export const getUser = async (req, res) => {
  try {
    // The 'protect' middleware attaches the user ID to req.user.id
    // We populate organizationId to get the organization details (name, type, etc.)
    const user = await User.findById(req.user.id).populate("organizationId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to get user profile", 
      error: error.message 
    });
  }
};