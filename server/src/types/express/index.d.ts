import { User } from "../../domain/enities/user"

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export {};