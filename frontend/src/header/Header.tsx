import {useAuth} from 'react-oidc-context';
import useAuthorization from '../hooks/useAuthorization.ts';

export function Header() {

    const auth = useAuth();
    const isAuthorized = useAuthorization();
    const login = () => auth.signinRedirect();
    const logout = () => auth.signoutRedirect();

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