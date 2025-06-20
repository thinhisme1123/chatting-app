import { Types } from "mongoose";

export interface User {
  _id?: string | Types.ObjectId;
  email: string;
  username: string;
  password: string;
  avatar: string;
}