// import jwt from "jsonwebtoken";

// export const protect = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "Not authorized" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };


// auth.middleware.js 
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and attach to request
      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      return next(); // CRITICAL: return here so the code stops!
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  console.log("AUTH HEADER:", req.headers.authorization);
  console.log("DECODED:", decoded);
  console.log("USER:", req.user);
  // If the code reaches here, it means no token was provided at all
  if (!token) {
    console.log("AUTH HEADER:", req.headers.authorization);
    console.log("DECODED:", decoded);
    console.log("USER:", req.user);
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};