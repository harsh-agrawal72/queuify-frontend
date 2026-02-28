import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — checks token + role
 * Usage: <ProtectedRoute roles={['superadmin']}><Page /></ProtectedRoute>
 */
const ProtectedRoute = ({ children, roles = [], role }) => {
    const { user } = useAuth();

    // Not logged in → login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role mismatch → login page
    // Support both 'roles' array and single 'role' prop
    const allowedRoles = roles.length > 0 ? roles : (role ? [role] : []);

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
