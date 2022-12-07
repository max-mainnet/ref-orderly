import useWebSocket, { ReadyState } from 'react-use-websocket';
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { OrderWSConnection } from './type';
import { getOrderlyConfig } from '../config';
import { useWalletSelector } from '../WalletSelectorContext';
import {
  getPublicKey,
  generateRequestSignatureHeader,
  toNonDivisibleNumber,
} from './utils';

function useInterval(callback: Function, delay: number) {
  const latestCallback = useRef<Function>(() => {});

  useEffect(() => {
    latestCallback.current = callback;
  });

  useEffect(() => {
    if (delay !== null) {
      const interval = setInterval(() => latestCallback.current(), delay || 0);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [delay]);
}

export const REF_ORDERLY_WS_ID_PREFIX = 'orderly_ws_';

export const useOrderlyWS = () => {
  const { accountId } = useWalletSelector();

  const [socketUrl, setSocketUrl] = useState(
    getOrderlyConfig().ORDERLY_WS_ENDPOINT + `/${accountId}`
  );

  const [messageHistory, setMessageHistory] = useState([]);

  const { lastMessage, readyState, lastJsonMessage, sendMessage } =
    useWebSocket(socketUrl);

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage, setMessageHistory]);

  console.log({
    lastMessage,
  });
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return {
    connectionStatus,
    messageHistory,
    lastMessage,
    sendMessage,
    lastJsonMessage,
  };
};
export const usePrivateOrderlyWS = () => {
  const { accountId } = useWalletSelector();

  const [socketUrl, setSocketUrl] = useState(
    getOrderlyConfig().ORDERLY_WS_ENDPOINT_PRIVATE + `/${accountId}`
  );

  const [messageHistory, setMessageHistory] = useState([]);

  const { lastMessage, readyState, lastJsonMessage, sendMessage } =
    useWebSocket(socketUrl);

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage, setMessageHistory]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return {
    connectionStatus,
    messageHistory,
    lastMessage,
    sendMessage,
    lastJsonMessage,
  };
};

export const useOrderlyPingPong = () => {
  // const state: OrderWSConnection = {
  //   // event: 'ping',
  // };

  const { connectionStatus, messageHistory, lastMessage, sendMessage } =
    useOrderlyWS();

  useInterval(
    () =>
      sendMessage(
        JSON.stringify({
          id: '',
          event: 'ping',
          ts: Date.now(),
        })
      ),
    10000
  );

  return {
    connectionStatus,
    messageHistory,
    lastMessage,
  };
};

export const generateMarketDataFlow = ({ symbol }: { symbol: string }) => {
  let data: OrderWSConnection[] = [
    {
      id: `request-order-${symbol}`,
      event: 'request',
      params: {
        symbol,
        type: 'orderbook',
      },
    },
    {
      id: `${symbol}@orderbook`,
      event: 'subscribe',
      topic: `${symbol}@orderbook`,
    },
    {
      id: `${symbol}@bbo`,
      event: 'subscribe',
      topic: `${symbol}@bbo`,
    },
    {
      topic: `${symbol}@kline_1m`,
      event: 'subscribe',
      id: `${symbol}@kline_1m`,
    },
  ];

  return data;
};
export const initDataFlow = ({ symbol }: { symbol: string }) => {
  let data: OrderWSConnection[] = [
    {
      id: `request-order-${symbol}`,
      event: 'request',
      params: {
        symbol,
        type: 'orderbook',
      },
    },

    {
      topic: `${symbol}@kline_1m`,
      event: 'subscribe',
      id: `${symbol}@kline_1m`,
    },
  ];

  return data;
};

export const useOrderlyMarketData = ({ symbol }: { symbol: string }) => {
  const {
    connectionStatus,
    messageHistory,
    lastMessage,
    lastJsonMessage,
    sendMessage,
  } = useOrderlyWS();

  const [lastSuccess, setLastSuccess] = useState(false);

  const handlePing = () =>
    sendMessage(
      JSON.stringify({
        id: '',
        event: 'ping',
        ts: Date.now(),
      })
    );

  useInterval(handlePing, 10000);

  useEffect(() => {
    handlePing();
  }, []);

  useEffect(() => {
    if (lastJsonMessage && lastJsonMessage.event === 'pong') {
      const data = generateMarketDataFlow({ symbol });
      Promise.all(
        data.map((d) => {
          sendMessage(JSON.stringify(d));
        })
      );
    }

    if (lastJsonMessage) {
      setLastSuccess(lastJsonMessage.success);
    }
  }, [lastJsonMessage]);

  return {
    connectionStatus,
    messageHistory,
    lastMessage,
    lastSuccess,
  };
};

export const useOrderlyPrivateData = () => {
  const {
    connectionStatus,
    messageHistory,
    lastMessage,
    sendMessage,
    lastJsonMessage,
  } = usePrivateOrderlyWS();

  const [authPass, setAuthPass] = useState(false);
  const { accountId } = useWalletSelector();
  const [lastSuccess, setLastSuccess] = useState(false);

  const [initData, setInitData] = useState<OrderWSConnection[]>();

  const [orderlyKey, setOrderlyKey] = useState('');

  const [requestSignature, setRequestSignature] = useState('');

  const time_stamp = useMemo(() => Date.now(), []);

  useEffect(() => {
    generateRequestSignatureHeader({
      accountId,
      time_stamp,
      url: null,
      body: null,
    }).then(setRequestSignature);
  }, []);

  useEffect(() => {
    getPublicKey(accountId).then((res) => {
      setOrderlyKey(res);
    });
  }, []);

  useEffect(() => {
    if (!orderlyKey || !requestSignature) return;

    const authData = {
      id: '123r',
      event: 'auth',
      params: {
        timestamp: time_stamp,
        sign: requestSignature,
        orderly_key: orderlyKey,
      },
    };

    sendMessage(JSON.stringify(authData));
  }, [orderlyKey, requestSignature]);

  const handlePing = () => {
    if (!authPass) return;
    sendMessage(
      JSON.stringify({
        id: '',
        event: 'ping',
        ts: Date.now(),
      })
    );
  };

  useInterval(handlePing, 5000);

  useEffect(() => {
    if (
      lastJsonMessage &&
      lastJsonMessage.event === 'auth' &&
      lastJsonMessage.success === true
    ) {
      setAuthPass(true);
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    if (lastJsonMessage) {
      setLastSuccess(lastJsonMessage.success);
    }

    // handlePing();
  }, [lastJsonMessage]);

  return {
    connectionStatus,
    messageHistory,
    lastMessage,
    lastSuccess,
  };
};
