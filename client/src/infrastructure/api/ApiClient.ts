import axios, { type AxiosInstance } from "axios"

export class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001",
      timeout: 10000,
    })

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
  }

  get instance() {
    return this.client
  }
}
