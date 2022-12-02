import { getOrderlyConfig } from '../config';
import {
  getPublicKey,
  generateRequestSignatureHeader,
  get_orderly_private_key_path,
  get_orderly_public_key_path,
} from './utils';
import { orderlyOrder } from './type';
import { get_user_trading_key } from './on-chain-api';
import { ec } from 'elliptic';
import { generateOrderSignature, OFF_CHAIN_METHOD } from './utils';

// get

export const getOrderlyHeaders = async ({
  url,
  accountId,
  trading,
  method,
  body,
}: {
  url?: string;
  accountId: string;
  trading?: boolean;
  method: OFF_CHAIN_METHOD;
  body?: object;
}) => {
  const time_stamp = Date.now();

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'orderly-timestamp': `${time_stamp}`,
    'orderly-account-id': accountId,
    'orderly-key': await getPublicKey(accountId),
    'orderly-signature': await generateRequestSignatureHeader({
      accountId,
      time_stamp,
      url: url || '',
      body: body || null,
      method,
    }),
  };

  if (trading) {
    headers['orderly-trading-key'] = localStorage.getItem(
      get_orderly_public_key_path(accountId)
    );
  }

  return headers;
};

export const requestOrderly = async ({
  url,
  accountId,
}: {
  url?: string;
  accountId: string;
}) => {
  const headers = await getOrderlyHeaders({
    url,
    accountId,
    trading: false,
    method: 'GET',
  });

  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'GET',
    headers,
  }).then((res) => {
    return res.json();
  });
};

export const tradingOrderly = async ({
  url,
  accountId,
  body,
}: {
  url?: string;
  accountId: string;
  body: object;
}) => {
  const headers = await getOrderlyHeaders({
    url,
    accountId,
    trading: true,
    method: 'POST',
    body,
  });
  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }).then((res) => {
    return res.json();
  });
};

export const createOrder = async (
  props: orderlyOrder & {
    accountId: string;
  }
) => {
  const {
    accountId,
    symbol,
    client_order_id,
    order_type,
    order_price,
    order_quantity,
    order_amount,
    side,
    broker_id,
    visible_quantity,
  } = props;

  //Note for DELETE requests, the parameters are not in the json body.
  const message = Object.entries(props)
    .filter(([k, v], i) => {
      return v !== undefined && v !== null;
    })
    .map(([k, v], i) => {
      if (typeof v === 'number') {
        return `${k}=${parseFloat(v.toString())}`;
      }
      return `${k}=${v}`;
    })
    .sort()
    .join('&');

  const signature = generateOrderSignature(accountId, message);

  const body = {
    symbol,
    client_order_id,
    order_type,
    order_price,
    order_quantity,
    order_amount,
    side,
    broker_id,
    visible_quantity,
    signature,
  };

  return await tradingOrderly({
    accountId,
    url: '/v1/order',
    body,
  });
};

export const getOrderlyPublic = async (url?: string) => {
  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'GET',
  }).then((res) => {
    return res.json();
  });
};
