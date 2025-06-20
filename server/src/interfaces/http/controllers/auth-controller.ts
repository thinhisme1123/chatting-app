import { Request, Response } from "express";
import { loginUser } from "../../../application/auth/login-use-case";
import { registerUser } from "../../../application/auth/register-use-case";
import { generateToken } from "../../../utils/jwt";
import { UserModel } from "../../../infrastructure/db/models/user-model";

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await loginUser(email, password);
    const token = generateToken(result.userId); // your JWT or session logic

    res.json({
      user: result.user,
      token,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ message });
  }
};

export const registerController = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  try {
    const result = await registerUser(email, username, password);
    res.status(201).json({ message: "Đăng ký thành công", ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  const { userId } = req.body; // hoặc lấy từ JWT decode middleware nếu có

  try {
    res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi đăng xuất" });
  }
};

export const getAllUsersExceptMe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.query.currentUserId as string;
    if (!currentUserId) {
      res.status(400).json({ error: "Missing user ID" });
      return;
    }

    const users = await UserModel.find({ _id: { $ne: currentUserId } }).select(
      "-password"
    );

    const transformedUsers = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      isOnline: true, // or calculate from socket if you have it
    }));

    res.status(200).json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
