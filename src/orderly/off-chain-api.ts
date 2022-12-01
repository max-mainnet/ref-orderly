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
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'orderly-timestamp': `${Date.now()}`,
    'orderly-account-id': accountId,
    'orderly-key': await getPublicKey(accountId),
    'orderly-signature': await getOrderlySignature({
      accountId,
      time_stamp: Date.now(),
      url: url || '',
      body: null,
      method: 'GET',
    }),
  };

  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'GET',
    headers,
  });
};
