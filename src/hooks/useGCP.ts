import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { useEffect, useState } from "react";

const OAUTH_SCOPE =
  "https://www.googleapis.com/auth/cloud-platform.read-only https://www.googleapis.com/auth/compute";

export default function useGCP() {
  const [oauthUser, setOAuthUser] = useState<any>();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authClient, setAuthClient] = useState<any>();
  const [projects, setProjects] = useState<any[]>();

  const { network } = useWalletSelector();

  useEffect(() => {
    window.gapi.load("client", () => {
      window.gapi.client
        .init({
          apiKey: "AIzaSyCXBs_7uR9X7wNIWgNuD5D7nvTniKsfjGU",
          clientId:
            network === "mainnet"
              ? "219952077564-nab34fgrudtespc62grk3er44t1iar1o.apps.googleusercontent.com"
              : "398338012986-f9ge03gubuvksee6rsmtorrpgtrsppf2.apps.googleusercontent.com",
          scope: OAUTH_SCOPE,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/compute/v1/rest",
            "https://cloudresourcemanager.googleapis.com/$discovery/rest?version=v1",
          ],
        })
        .then(() => {
          const client = window.gapi.auth2.getAuthInstance();
          setAuthClient(client);
        });
    });
  }, [network]);

  useEffect(() => {
    if (!authClient) {
      return;
    }

    const checkStatus = () => {
      const user = authClient.currentUser.get();
      const authorized = user.hasGrantedScopes(OAUTH_SCOPE);

      setIsAuthorized(authorized);
      if (authorized) {
        console.log("authorized", user);

        setOAuthUser(user);

        const request = window.gapi.client.request({
          method: "GET",
          path: "https://cloudresourcemanager.googleapis.com/v1/projects",
        });

        request.execute((res: any) => {
          setProjects(res?.projects);
          console.log(res);
        });
      }
    };

    if (authClient.isSignedIn.get()) {
      checkStatus();
    }

    authClient.isSignedIn.listen(checkStatus);
  }, [authClient]);

  return {
    projects,
    isAuthorized,
    oauthUser,
    authClient,
  };
}
