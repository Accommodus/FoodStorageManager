import { Request, Response } from "express";
import { UserModel } from "./models/Users";
import bcrypt from "bcrypt";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }    

    // Login success
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        enabled: user.enabled,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
}