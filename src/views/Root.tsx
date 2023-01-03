import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { SWRConfig } from "swr";
import axios from "axios";
import { Box, useColorModeValue, useToast, Link } from "@chakra-ui/react";
import { Header, Footer } from "components";
import { providers } from "near-api-js";
import { Outlet } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useMatchMutate } from "hooks";
import { API_HOST } from "config";
import { useWalletSelector } from "components/WalletSelectorContextProvider";
import { Toast } from "components/common/toast";

export const Root: React.FC = () => {
  const headerBg = useColorModeValue("whiteAlpha.800", "whiteAlpha.50");
  const homeBodyBg = useColorModeValue("white", "#0b0c21");
  const otherPageBodyBg = useColorModeValue("#f6f7fa", "#0b0c21");
  const location = useLocation();

  const navigate = useNavigate();

  const toast = useToast();
  const toastIdRef = useRef<any>();
  const urlParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );

  const { accountId, networkConfig, selector } = useWalletSelector();

  const matchMutate = useMatchMutate();

  // change body bg in different page
  useEffect(() => {
    if (location.pathname === "/home") {
      document.body.style.background = homeBodyBg;
    } else {
      document.body.style.background = otherPageBodyBg;
    }
  }, [location, homeBodyBg, otherPageBodyBg]);

  const checkRedirect = useCallback(() => {
    if (/appchains\/join/.test(location.pathname)) {
      navigate("/appchains");
    } else if (/appchains\/overview/.test(location.pathname)) {
      axios.post(`${API_HOST}/update-appchains`).then(() => {
        // refresh cache
        matchMutate(/^appchain\//);
        matchMutate(/^appchains\//);
      });
    }
  }, [location.pathname, navigate, matchMutate]);

  // check tx status
  useEffect(() => {
    if (!accountId) {
      return;
    }

    const transactionHashes = urlParams.get("transactionHashes") || "";
    const errorMessage = urlParams.get("errorMessage") || "";

    if (errorMessage) {
      Toast.error(decodeURIComponent(errorMessage));
      clearMessageAndHashes();
      return;
    } else if (transactionHashes) {
      toastIdRef.current = Toast.info("");
    } else {
      return;
    }

    const provider = new providers.JsonRpcProvider({
      url: selector.options.network.nodeUrl,
    });

    const txHashes = transactionHashes.split(",");

    const lastTxHash = txHashes[txHashes.length - 1];
    provider
      .txStatus(lastTxHash, accountId)
      .then((status) => {
        const { receipts_outcome } = status;
        let message = "";

        for (let i = 0; i < receipts_outcome.length; i++) {
          const { outcome } = receipts_outcome[i];
          if ((outcome.status as any).Failure) {
            message = JSON.stringify((outcome.status as any).Failure);
            break;
          }
        }
        if (message) {
          throw new Error(message);
        }
        if (/register/.test(location.pathname)) {
          window.location.replace("/appchains");
        } else if (/bridge/.test(location.pathname)) {
          toast.close(toastIdRef.current);
        } else if (toastIdRef.current) {
          if (/bridge/.test(location.pathname)) {
            toast.close(toastIdRef.current);
          } else {
            toast.update(toastIdRef.current, {
              title: "Success",
              description: (
                <Link
                  variant="octo-linear"
                  href={`${networkConfig?.near.explorerUrl}/transactions/${lastTxHash}`}
                  className="success-tx-link"
                >
                  Click to check transaction detail
                </Link>
              ),
              duration: 2500,
              variant: "left-accent",
              status: "success",
            });
          }
        }

        checkRedirect();
      })
      .catch((err) => {
        toast.update(toastIdRef.current, {
          description: err?.kind?.ExecutionError || err.toString(),
          duration: 5000,
          status: "error",
        });
      });

    clearMessageAndHashes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParams]);

  const clearMessageAndHashes = useCallback(() => {
    const { protocol, host, pathname, hash } = window.location;
    urlParams.delete("errorMessage");
    urlParams.delete("errorCode");
    urlParams.delete("transactionHashes");
    const params = urlParams.toString();
    const newUrl = `${protocol}//${host}${pathname}${
      params ? "?" + params : ""
    }${hash}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  }, [urlParams]);

  return (
    <SWRConfig
      value={{
        refreshInterval: 60 * 1000,
        fetcher: (api) =>
          axios.get(`${API_HOST}/${api}`).then((res) => res.data),
      }}
    >
      <Box position="relative" zIndex="99" bgColor={headerBg}>
        <Header />
      </Box>
      <Outlet />
      <Box mt={16}>
        <Footer />
      </Box>
    </SWRConfig>
  );
};
