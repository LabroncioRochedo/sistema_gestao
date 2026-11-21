import { create } from "axios";
import { API_URL } from "@/constants/api";

const api = create({
  baseURL: API_URL,
});

export default api;