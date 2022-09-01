import React from 'react';
import './App.css';

// MSAL imports
import { MsalAuthenticationTemplate, MsalProvider } from "@azure/msal-react";
import {InteractionType, IPublicClientApplication} from "@azure/msal-browser";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

type AppProps = {
  pca: IPublicClientApplication
};

function App({ pca }: AppProps) {
  return (
      <MsalProvider instance={pca}>
        <h1>Hello</h1>

        <AuthenticatedTemplate>
          <>You are signed in.</>
        </AuthenticatedTemplate>

        <UnauthenticatedTemplate>
          <p>Please sign-in to see your profile information.</p>
        </UnauthenticatedTemplate>

          <MsalAuthenticationTemplate
              interactionType={InteractionType.Redirect}
              authenticationRequest={loginRequest}
          >
              <p>foo</p>
          </MsalAuthenticationTemplate>

      </MsalProvider>
  );
}

export default App;
