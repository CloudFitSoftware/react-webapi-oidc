import React, {useCallback} from 'react';
import {useKeycloak} from '@react-keycloak/web';


export function Header() {

    const {keycloak, initialized} = useKeycloak();

    const login = useCallback(() => {
        keycloak?.login();
    }, [keycloak]);

    const logout = useCallback(() => {
        keycloak?.logout();
    }, [keycloak]);

    if (!initialized) {
        return <div>Loading...</div>;
    }

    return <>
        {!keycloak.authenticated && (
            <><span>You are currently not logged in. &nbsp;</span>
                <button onClick={login}>
                    Login
                </button>
            </>
        )}

        {!!keycloak.authenticated && (
            <button onClick={logout}>
                Logout ({keycloak.tokenParsed?.preferred_username})
            </button>
        )}
    </>;
}