import { apiRequest } from "./client";

export function getHealthcheck() {
  return apiRequest("/healthcheck");
}
