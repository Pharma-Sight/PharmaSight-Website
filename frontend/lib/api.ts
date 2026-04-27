// lib/api.ts
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || "http://localhost:5000" || "https://pharmasight-website.onrender.com";
const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "https://pharma-site-ai.onrender.com";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; // Added PATCH method

export const apiRequest = async (
  endpoint: string, // Changed: we no longer pass baseUrl every time
  method: Method,
  data?: any
) => {
  // SMART ROUTING: 
  // If endpoint is '/predict' or other AI routes, use AI_URL. Otherwise, use EXPRESS_URL.
  const aiRoutes = ['/predict', '/district-risk', '/fairness-audit'];
  const baseUrl = aiRoutes.some(route => endpoint.startsWith(route)) 
    ? AI_URL 
    : EXPRESS_URL;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  // FIX: Ensure there's a single slash between baseUrl and endpoint
  // And ensures the "method" isn't accidentally appended to the string
  const fullUrl = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const res = await fetch(fullUrl, {
    method,
    headers: { "Content-Type": "application/json",
      // 2. Attach the token here
      ...(token && { "Authorization": `Bearer ${token}` }) },
    body: data ? JSON.stringify(data) : undefined,
  });

  // This check prevents the JSON parsing error
  const contentType = res.headers.get("content-type");
  if (!res.ok || !contentType || !contentType.includes("application/json")) {
    const errorText = await res.text();
    console.error("Server returned non-JSON response:", errorText);
    throw new Error(`Server Error: ${res.status}`);
  }

  return res.json();
};