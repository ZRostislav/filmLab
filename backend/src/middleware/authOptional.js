import jwt from "jsonwebtoken";

const authOptional = (req, res, next) => {
  const header = req.headers["authorization"];
  req.user = null; // 👈 по умолчанию нет юзера

  if (!header) return next();

  // поддержка как "Bearer ..." так и просто токена
  const token = header.startsWith("Bearer ")
    ? header.split(" ")[1]
    : header;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // если в токене есть id или sub — прокинем
    req.user = {
      ...decoded,
      id: decoded.id || decoded.sub,
    };
  } catch (err) {
    console.error("❌ Неверный токен:", err.message);
    req.user = null;
  }

  next();
};

export default authOptional;
