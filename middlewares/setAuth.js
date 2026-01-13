import jwt from "jsonwebtoken";

export const setAuthCookies = (res, payload = { id: "anonymous" }) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || "mySecret", {
    expiresIn: "60s", // 1 minute
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET || "mySecret", {
    expiresIn: "7d",
  });

  res.setHeader("Set-Cookie", [
    `access_token=${accessToken}; Path=/; Max-Age=60; HttpOnly; Secure; SameSite=None`,
    `refresh_token=${refreshToken}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=None`,
  ]);

  return { accessToken, refreshToken };
};
