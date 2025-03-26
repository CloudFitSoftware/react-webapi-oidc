import {useEffect, useState} from 'react';
import {useAuth} from 'react-oidc-context';

async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function Header() {

    const auth = useAuth();

    const login = () => auth.signinRedirect();

    const logout = () => auth.signoutRedirect();

    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const requiredRoleHash = import.meta.env.VITE_ROLE_HASH ?? '';

        // Extract roles from the user profile
        const roles: string[] = Array.isArray(auth.user?.profile?.role) ? auth.user.profile.role : [];

        const checkAuthorization = async () => {
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
        };

        if (auth.user?.profile?.role) {
            checkAuthorization().then();
        }

    }, [auth.user]);

    if (auth.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {!auth.isAuthenticated && (
                <>
                    <span>You are currently <em>not logged in</em>. &nbsp;</span>
                    <button onClick={login}>Login</button>
                </>
            )}

            {auth.isAuthenticated && (
                <>
                    <button onClick={logout}>
                        Logout ({auth.user?.profile?.preferred_username})
                    </button>
                    <p>
                        You are logged in
                        {isAuthorized ? (
                            <> and are </>
                        ) : (
                            <> but are <em>not</em> </>
                        )}
                        authorized to use this application.
                    </p>
                </>
            )}
        </>
    );
}