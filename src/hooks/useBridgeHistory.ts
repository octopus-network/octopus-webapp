import { BRIDGE_HELPER_API } from "config";
import { useEffect, useState } from "react";

export default function useBridgeHistory(
  direction: string,
  appchainId?: string,
  from?: string
) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory([]);
    if (direction && appchainId && from) {
      fetch(
        `${BRIDGE_HELPER_API}/${direction}/txs_by_from?start=0&size=20&appchain=${appchainId}&from=${from}`,
        {
          headers: { "Content-Type": "application/json; charset=utf-8" },
          method: "GET",
        }
      )
        .then((res) => res.json())
        .then((res) => setHistory(res))
        .catch(() => {
          setHistory([]);
        });
    }
  }, [direction, appchainId, from]);

  return history;
}
