import getConfig from './config';
import {
  Near,
  keyStores,
  utils,
  WalletConnection,
  providers,
} from 'near-api-js';
import {
  Transaction as WSTransaction,
  AddKeyAction,
  AddKeyPermission,
} from '@near-wallet-selector/core';
export interface ViewFunctionOptions {
  methodName: string;
  args?: object;
}

import BN from 'bn.js';

export const getGas = (gas: string) =>
  gas ? new BN(gas) : new BN('100000000000000');

export const getAmount = (amount: string) =>
  amount ? new BN(utils.format.parseNearAmount(amount)) : new BN('0');

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

  const wsTransactions: WSTransaction[] = [];

  transactions.forEach((transaction) => {
    wsTransactions.push({
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
      transactions: wsTransactions,
      callbackUrl,
    })
    .then((res) => {
      console.log(res);
    })
    .catch(() => {
      alert('fail');
    });
};

export const getFunctionCallTransaction = async (
  transactions: Transaction[]
) => {
  const signerId = await window.selector?.store?.getState()?.accounts[0]
    ?.accountId;

  const wsTransactions: WSTransaction[] = [];

  transactions.forEach((transaction) => {
    wsTransactions.push({
      signerId: signerId!,
      receiverId: transaction.receiverId,
      actions: transaction.functionCalls.map((fc) => {
        return {
          type: 'FunctionCall',
          params: {
            methodName: fc.methodName,
            args: fc.args || [],
            gas: getGas(fc.gas).toNumber().toFixed(),
            deposit: utils.format.parseNearAmount(fc.amount || '0')!,
          },
        };
      }),
    });
  });

  return wsTransactions;
};

export const getAddFunctionCallKeyTransaction = async ({
  receiverId,
  publicKey,
}: {
  receiverId: string;
  publicKey: string;
}) => {
  const signerId = await window.selector?.store?.getState()?.accounts[0]
    ?.accountId;

  if (!signerId) throw Error('Please sign in first.');

  const wsTransactions: WSTransaction[] = [];
  wsTransactions.push({
    signerId: signerId!,
    receiverId: signerId,
    actions: [
      {
        type: 'AddKey',
        params: {
          publicKey,
          accessKey: {
            permission: {
              receiverId,
            },
          },
        },
      },
    ],
  });

  return wsTransactions;
};
