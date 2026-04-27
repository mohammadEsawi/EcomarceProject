import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "secret";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    secret(),
    { expiresIn: "12h" },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, secret());
}
