const requireRole = (allowedRoles = ["admin"]) => {
  return (req, res, next) => {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        message: "Access denied. Administrator privileges required.",
      });
    }

    next();
  };
};

const requireAdmin = requireRole(["admin"]);

module.exports = {
  requireRole,
  requireAdmin,
};
