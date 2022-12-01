import { getOrderlyConfig } from '../config';
import { getPublicKey, generateOrderlySignatureHeader } from './utils';

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

export const createOrder = async () => {};

export const getOrderlyPublic = async (url?: string) => {
  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'GET',
  }).then((res) => {
    return res.json();
  });
};
