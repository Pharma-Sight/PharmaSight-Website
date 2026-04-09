// lib/api.ts

const BASE_URL = "http://localhost:5000/api";

type Method = "GET" | "POST" | "PUT" | "DELETE";

export const apiRequest = async (
  endpoint: string,
  method: Method = "GET",
  data?: any,
  token?: string
) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(data && { body: JSON.stringify(data) }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Something went wrong");
  }

  return result;
};