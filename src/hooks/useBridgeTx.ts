import { BRIDGE_HELPER_API } from "config";
import { useEffect, useState } from "react";

export default function useBridgeTx(txId?: string) {
  const [tx, setTx] = useState<any>();

  useEffect(() => {
    setTx(undefined);
    if (txId) {
      fetch(`${BRIDGE_HELPER_API}/bridge_txs/${txId}`, {
        headers: { "Content-Type": "application/json; charset=utf-8" },
        method: "GET",
      })
        .then((res) => res.json())
        .then((res) => setTx(res))
        .catch(() => {
          setTx(undefined);
        });
    }
  }, [txId]);

  return tx;
}
