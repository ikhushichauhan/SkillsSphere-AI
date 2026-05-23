import { isConnected } from "../database/db.js";

const requireDB = (req, res, next) => {
  if (!isConnected) {
    return res.status(503).json({
      success: false,
      status: "error",
      message: "Database is currently unavailable — please try again later",
    });
  }
  next();
};

export default requireDB;
