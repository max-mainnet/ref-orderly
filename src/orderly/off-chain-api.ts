import { getOrderlyConfig } from '../config';
import { getPublicKey, generateOrderlySignatureHeader } from './utils';
import { orderlyOrder } from './type';
import { get_user_trading_key } from './on-chain-api';

// get
export const requestOrderly = async ({
  url,
  accountId,
}: {
  url?: string;
  accountId: string;
}) => {
  const time_stamp = Date.now();

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'orderly-timestamp': `${time_stamp}`,
    'orderly-account-id': accountId,
    'orderly-key': await getPublicKey(accountId),
    'orderly-signature': await generateOrderlySignatureHeader({
      accountId,
      time_stamp,
      url: url || '',
      body: null,
      method: 'GET',
    }),
  };

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
  const time_stamp = Date.now();

  const headers = {
    'Content-Type': 'application/json',
    'orderly-timestamp': `${time_stamp}`,
    'orderly-account-id': accountId,
    'orderly-key': await getPublicKey(accountId),
    'orderly-trading-key': await get_user_trading_key(accountId),
    'orderly-signature': await generateOrderlySignatureHeader({
      accountId,
      time_stamp,
      url: url || '',
      body: null,
      method: 'POST',
    }),
  };

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
    signature,
    broker_id,
    visible_quantity,
  } = props;

  // const validParams =
};

export const getOrderlyPublic = async (url?: string) => {
  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'GET',
  }).then((res) => {
    return res.json();
  });
};
