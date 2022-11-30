import { getOrderlyConfig } from '~config';
import { getPublicKey } from './utils';

// get
export const queryOrderly = async ({
  url,
  accountId,
}: {
  url?: string;
  accountId: string;
}) => {
  // const headers =  {
  //   'Content-Type': 'application/x-www-form-urlencoded',
  //   'orderly-timestamp': `${Date.now()}`,
  //   'orderly-account-id': accountId,
  //   'orderly-key': getPublicKey(accountId),
  //   'orderly-signature':
  // }

  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'GET',
    // headers,
  });
};
