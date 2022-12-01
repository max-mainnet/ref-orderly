import { getOrderlyConfig } from '../config';
import { getPublicKey, getOrderlySignature } from './utils';

// get
export const queryOrderly = async ({
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
    'orderly-signature': await getOrderlySignature({
      accountId,
      time_stamp,
      url: url || '',
      body: null,
      method: 'GET',
    }),
  };

  console.log({
    headers,
  });

  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'GET',
    headers,
  });
};
