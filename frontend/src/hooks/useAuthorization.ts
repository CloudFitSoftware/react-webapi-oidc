import {useCallback, useEffect, useState} from 'react';
import {useAuth} from 'react-oidc-context';

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function useAuthorization() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const auth = useAuth();
    const requiredRoleHash = import.meta.env.VITE_ROLE_HASH.toUpperCase();

    const checkAuthorization = useCallback(async (roles: string[]) => {
        try {
            for (const role of roles) {
                const roleHash = await sha256(role);
                if (roleHash === requiredRoleHash) {
                    setIsAuthorized(true);
                    return;
                }
            }
            setIsAuthorized(false);
        } catch (error) {
            console.error('Error checking authorization:', error);
            setIsAuthorized(false);
        }
    }, [requiredRoleHash]);

    useEffect(() => {

        const roles = Array.isArray(auth.user?.profile?.role) ? auth.user.profile.role : [];
        if (roles.length > 0) {
            checkAuthorization(roles).then();
        } else {
            setIsAuthorized(false);
        }
    }, [auth.user?.profile?.role, checkAuthorization, requiredRoleHash]);

    return isAuthorized;
}

export default useAuthorization;