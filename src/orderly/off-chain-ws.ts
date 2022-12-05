import useWebSocket, { ReadyState } from 'react-use-websocket';
import React, { useState, useCallback, useEffect } from 'react';
import { OrderWSConnection } from './type';
import { getOrderlyConfig } from '../config';
import { useWalletSelector } from '../WalletSelectorContext';
import {
  getPublicKey,
  generateRequestSignatureHeader,
  toNonDivisibleNumber,
} from './utils';

export const REF_ORDERLY_WS_ID_PREFIX = 'orderly_ws_';

export const useOrderlyWS = (props: Record<string, any>) => {
  const { accountId } = useWalletSelector();

  const [socketUrl, setSocketUrl] = useState(
    getOrderlyConfig().ORDERLY_WS_ENDPOINT + `/${accountId}`
  );

  const [messageHistory, setMessageHistory] = useState([]);

  const { lastMessage, readyState } = useWebSocket(socketUrl, {
    queryParams: props,
  });

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
  };
};

export const useOrderlyPingPong = () => {
  const state: OrderWSConnection = {
    event: 'ping',
  };

  const { connectionStatus, messageHistory, lastMessage } = useOrderlyWS(state);
  console.log({
    lastMessage: lastMessage?.data,
  });
  return {
    connectionStatus,
    messageHistory,
    lastMessage,
  };
};

export const useOrderlyAuth = () => {
  const { accountId } = useWalletSelector();

  const [orderlyKey, setOrderlyKey] = useState('');

  const [requestSignature, setRequestSignature] = useState('');

  const time_stamp = Date.now();

  useEffect(() => {
    generateRequestSignatureHeader({
      accountId,
      time_stamp,
      url: '',
      body: null,
    }).then(setRequestSignature);
  }, []);

  useEffect(() => {
    getPublicKey(accountId).then((res) => {
      setOrderlyKey(res);
    });
  }, []);

  // if (!requestSignature || !orderlyKey) {
  //   return;
  // }

  const state: OrderWSConnection = {
    id: `${accountId}-ref-orderly-auth`,
    event: 'auth',
    orderly_key: orderlyKey,
    sign: requestSignature,
  };

  const { connectionStatus, messageHistory, lastMessage } = useOrderlyWS(state);

  return {
    connectionStatus,
    messageHistory,
    lastMessage,
  };
};

export const useOrderlyOrderbook = ({ symbol }: { symbol: string }) => {
  const state: OrderWSConnection = {
    id: REF_ORDERLY_WS_ID_PREFIX + 'orderbook',
    event: 'request',
    type: 'orderbook',
    symbol: symbol,
  };

  const { connectionStatus, messageHistory, lastMessage } = useOrderlyWS(state);
  console.log({
    lastMessage: lastMessage?.data,
    connectionStatus,
  });
  return {
    connectionStatus,
    messageHistory,
    lastMessage,
  };
};
