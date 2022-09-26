import React, {useCallback, useEffect, useState} from 'react';
import {useKeycloak} from '@react-keycloak/web';

async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export function Header() {

    const {keycloak, initialized} = useKeycloak();

    const login = useCallback(() => {
        keycloak?.login();
    }, [keycloak]);

    const logout = useCallback(() => {
        keycloak?.logout();
    }, [keycloak]);

    const [isAuthorized, updateIsAuthorized] = useState(false);

    useEffect(() => {
        const requiredRoleHash = process.env.REACT_APP_ROLE_HASH;
        const roles: string[] = keycloak.tokenParsed?.role;

        const isCurrentlyAuthorized = async () => {
            for (const userRole in roles) {
                const roleHash = await sha256(roles[userRole]);
                if (roleHash === requiredRoleHash) {
                    updateIsAuthorized(true);
                    return;
                }
            }
            updateIsAuthorized(false);
        };
        isCurrentlyAuthorized().then();
    }, [keycloak, initialized]);

    if (!initialized) {
        return <div>Loading...</div>;
    }

    return <>
        {!keycloak.authenticated && (
            <>
                <span>You are currently not logged in. &nbsp;</span>
                <button onClick={login}>
                    Login
                </button>
            </>
        )}

        {!!keycloak.authenticated && (
            <>
                <button onClick={logout}>
                    Logout ({keycloak.tokenParsed?.preferred_username})
                </button>
                <p>
                    You are logged in
                    {isAuthorized &&
                        <> and is </>
                    }
                    {!isAuthorized &&
                        <> but <em>not</em> </>
                    }
                    authorized to use this application.
                </p>
            </>
        )}
    </>;
}