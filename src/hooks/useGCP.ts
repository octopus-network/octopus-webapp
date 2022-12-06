import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { useCallback, useEffect, useState } from "react";
import { b64utoutf8, KJUR } from "jsrsasign";

const OAUTH_SCOPE =
  "https://www.googleapis.com/auth/cloud-platform.read-only https://www.googleapis.com/auth/compute";

// https://developers.google.com/identity/gsi/web/reference/js-reference
export default function useGCP(request = false) {
  const [oauthUser, setOAuthUser] = useState<any>();
  const [projects, setProjects] = useState<any[]>([]);
  const [accessToken, setAccessToken] = useState<any>();

  const { network } = useWalletSelector();

  const CLIENT_ID =
    network === "mainnet"
      ? "219952077564-nab34fgrudtespc62grk3er44t1iar1o.apps.googleusercontent.com"
      : "398338012986-frvsfm84pmibkoqi8l91g2c7nhf9qv7l.apps.googleusercontent.com";

  const handleCredentialResponse = async (e: any) => {
    const payloadObj = KJUR.jws.JWS.readSafeJSONString(
      b64utoutf8(e.credential.split(".")[1])
    );
    console.log("headerObj", payloadObj);
    setOAuthUser(payloadObj);
  };

  const onLogin = useCallback(() => {
    console.log("onLogin", CLIENT_ID);
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
    });
    window.google.accounts.id.prompt();
  }, [CLIENT_ID]);

  const onRequestAccessToken = useCallback(() => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: OAUTH_SCOPE,
      prompt: "select_account",
      callback(tokenResponse: any) {
        setAccessToken(tokenResponse);
        const xhr = new XMLHttpRequest();
        xhr.open(
          "GET",
          "https://cloudresourcemanager.googleapis.com/v1/projects"
        );
        xhr.setRequestHeader(
          "Authorization",
          "Bearer " + tokenResponse.access_token
        );
        xhr.send();
        xhr.onload = () => {
          setProjects(JSON.parse(xhr.response).projects);
        };
      },
      error_callback(error: any) {
        console.log("error", error);
      },
    });
    tokenClient.requestAccessToken();
  }, [CLIENT_ID]);

  useEffect(() => {
    if (!oauthUser && request) {
      onLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, oauthUser]);

  return {
    projects,
    oauthUser,
    onLogin,
    accessToken,
    onRequestAccessToken,
  };
}
