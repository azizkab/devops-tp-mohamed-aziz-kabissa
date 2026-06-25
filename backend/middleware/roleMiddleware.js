module.exports = (...rolesAutorises) => {
  return (req, res, next) => {
    if (!req.user || !rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({
        message: "Accès interdit",
      });
    }

    next();
  };
};
