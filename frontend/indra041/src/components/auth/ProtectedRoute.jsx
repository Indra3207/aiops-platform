function ProtectedRoute({ userRole, allowedRole, children }) {

  if (userRole !== allowedRole) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;