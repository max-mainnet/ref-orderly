import getConfig from './config';
import {
  Near,
  keyStores,
  utils,
  WalletConnection,
  providers,
} from 'near-api-js';
import { Transaction as WSTransaction } from '@near-wallet-selector/core';
export interface ViewFunctionOptions {
  methodName: string;
  args?: object;
}

import BN from 'bn.js';

export const getGas = (gas: string) =>
  gas ? new BN(gas) : new BN('100000000000000');

export interface FunctionCallOptions extends ViewFunctionOptions {
  gas?: string;
  amount?: string;
}

export interface Transaction {
  receiverId: string;
  functionCalls: FunctionCallOptions[];
}

export const keyStore = new keyStores.BrowserLocalStorageKeyStore();

export const config = getConfig();

export const near = new Near({
  keyStore,
  headers: {},
  ...config,
});

export const ORDERLY_ASSET_MANAGER = config.ORDERLY_ASSET_MANAGER;

export const orderlyViewFunction = async ({
  methodName,
  args,
}: ViewFunctionOptions) => {
  const nearConnection = await near.account(ORDERLY_ASSET_MANAGER);

  return nearConnection.viewFunction(ORDERLY_ASSET_MANAGER, methodName, args);
};

export const executeMultipleTransactions = async (
  transactions: Transaction[],
  callbackUrl?: string
) => {
  const wallet = await window.selector.wallet();

  const wstransactions: WSTransaction[] = [];

  transactions.forEach((transaction) => {
    wstransactions.push({
      signerId: wallet.getAccounts()?.[0]!,
      receiverId: transaction.receiverId,
      actions: transaction.functionCalls.map((fc) => {
        return {
          type: 'FunctionCall',
          params: {
            methodName: fc.methodName,
            args: fc.args,
            gas: getGas(fc.gas).toNumber().toFixed(),
            deposit: utils.format.parseNearAmount(fc.amount || '0')!,
          },
        };
      }),
    });
  });

  return wallet
    .signAndSendTransactions({
      transactions: wstransactions,
      callbackUrl,
    })
    .then((res) => {
      console.log(res);
    })
    .catch(() => {
      alert('fail');
    });
};
