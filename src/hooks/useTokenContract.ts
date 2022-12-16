import { TOKEN_METHODS } from "config/constants";
import { useEffect, useState } from "react";
import { TokenContract } from "types";
import useNearAccount from "./useNearAccount";

export function useTokenContract(contractId?: string) {
  const [tokenContract, setTokenContract] = useState<TokenContract>();
  const nearAccount = useNearAccount();

  useEffect(() => {
    if (nearAccount && contractId) {
      setTokenContract(
        new TokenContract(nearAccount!, contractId, TOKEN_METHODS)
      );
    } else {
      setTokenContract(undefined);
    }
  }, [contractId, nearAccount]);

  return tokenContract;
}
