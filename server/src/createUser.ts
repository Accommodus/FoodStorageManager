import {Request, Response} from "express";
import bcrypt from "bcrypt";
import {UserModel} from "./models/Users";

export const createUser = async (req: Request, res: Response, db: any) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        res.status(400).json({ message: "Email, password, and name are required" });
        return;
    }

    try {
        console.log("Checking for existing user");
        const existingUser = await UserModel.findOne({ email });
        console.log("Existing user check complete");
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed");
        const newUser = new UserModel({ email, name, passwordHash: hashedPassword });
        await newUser.save();
        console.log("User saved to database");

        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ message: "Server error" });
    }
};
