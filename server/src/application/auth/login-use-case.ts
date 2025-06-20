import { UserModel } from "../../infrastructure/db/models/user-model";
import { HttpError } from "../../interfaces/http/controllers/http-error";
import bcrypt from "bcrypt";

export const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new HttpError(401, "Email không tồn tại");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new HttpError(401, "Mật khẩu không đúng");

  return {
    userId: user._id.toString(),
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
  };
};
