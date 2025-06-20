import { UserModel } from '../../infrastructure/db/models/user-model';
import bcrypt from 'bcrypt';

export const registerUser = async (email: string,username: string, password: string) => {
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) throw new Error('Email đã tồn tại');

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new UserModel({ email, username, password: hashedPassword });
  await newUser.save();

  return { userId: newUser._id.toString() };
};