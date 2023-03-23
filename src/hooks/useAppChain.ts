import { ApiPromise, WsProvider } from "@polkadot/api";
import { APPCHAIN_SETTINGS } from "config";
import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  AppchainInfoWithAnchorStatus,
  Validator,
  ValidatorSessionKey,
} from "types";

export function useAppChain(appchainId?: string) {
  const [appchainValidators, setAppchainValidators] = useState<string[]>();
  const [appchainApi, setAppchainApi] = useState<ApiPromise>();
  const [validatorSessionKeys, setValidatorSessionKeys] =
    useState<Record<string, ValidatorSessionKey>>();

  const { data: appchain } = useSWR<AppchainInfoWithAnchorStatus>(
    appchainId ? `appchain/${appchainId}` : null
  );
  const { data: validators, error: validatorsError } = useSWR<Validator[]>(
    appchainId ? `validators/${appchainId}` : null
  );
  const appchainSettings = appchainId
    ? APPCHAIN_SETTINGS[appchainId]
    : undefined;

  useEffect(() => {
    if (!appchainSettings?.rpc_endpoint) {
      return;
    }

    const provider = new WsProvider(appchainSettings.rpc_endpoint);
    const api = new ApiPromise({ provider });

    api.isReady.then((api) => {
      setAppchainApi(api);

      api?.query?.session
        ?.validators()
        .then((vs: any) => {
          setAppchainValidators(vs.map((v: any) => v.toString()));
        })
        .catch(console.log);
    });
  }, [appchainSettings]);

  useEffect(() => {
    if (validators && appchainApi) {
      appchainApi?.query?.session?.nextKeys
        .multi(validators.map((v) => v.validator_id_in_appchain))
        .then((keys) => {
          let tmpObj: Record<string, ValidatorSessionKey> = {};
          keys.forEach(
            (key, idx) =>
              (tmpObj[validators[idx].validator_id] =
                key.toJSON() as ValidatorSessionKey)
          );

          setValidatorSessionKeys(tmpObj);
        });
    } else {
      setValidatorSessionKeys(undefined);
    }
  }, [appchainApi, validators]);

  return {
    validators: validators || [],
    validatorsError,
    appchain,
    appchainSettings,
    appchainApi,
    appchainValidators,
    validatorSessionKeys,
  };
}
