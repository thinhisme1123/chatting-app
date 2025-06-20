import { User } from "../../domain/models/user"

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export {};