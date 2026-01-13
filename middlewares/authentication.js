import jwt from "jsonwebtoken";

export const authenticateAccessToken = (req, res, next) => {
  //   const accessToken = req?.cookies?.access_token;

  const accessToken = req?.cookies?.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: "Access token missing" });
  }

  // manually parsing the cookies
  //   const cookies =
  //     token?.split(";").reduce((acc, cookie) => {
  //       const [key, value] = cookie.trim().split("=");
  //       acc[key] = value;
  //       return acc;
  //     }, {}) || {};

  try {
    const decoded = jwt.verify(accessToken, "mySecret");
    req.user = decoded; // you can access this in route

    next(); // ✅ Token valid, continue
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
