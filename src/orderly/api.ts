import {
  get_storage_deposit_amount,
  orderly_storage_deposit,
  user_account_exists,
  user_announce_key,
  user_request_set_trading_key,
  user_deposit_native_token,
  deposit_exact_token,
} from './on-chain-api';
import { Transaction as WSTransaction } from '@near-wallet-selector/core';
import {
  find_orderly_functionCall_key,
  getNormalizeTradingKey,
  toNonDivisibleNumber,
} from './utils';
import {
  getAddFunctionCallKeyTransaction,
  ORDERLY_ASSET_MANAGER,
} from '../near';
import { KeyPair } from 'near-api-js';
import {
  Transaction,
  getFunctionCallTransaction,
  near,
  getGas,
  getAmount,
} from '../near';

import { functionCall } from 'near-api-js/lib/transaction';
import { REGISTER_DEPOSIT_AMOUNT } from './on-chain-api';
import { getFTmetadata } from '../near';
import {
  formatNearAmount,
  parseNearAmount,
} from 'near-api-js/lib/utils/format';

const signAndSendTransactions = async (transactions: Transaction[]) => {
  const wsTransactions = await getFunctionCallTransaction(transactions);

  const wallet = await window.selector.wallet();

  await wallet
    .signAndSendTransactions({
      transactions: wsTransactions,
    })
    .then((res) => {
      console.log(res);
    });
};

const signAndSendTransaction = async (wsTransaction: WSTransaction) => {
  const wallet = await window.selector.wallet();

  await wallet.signAndSendTransaction(wsTransaction).then((res) => {
    console.log(res);
  });
};

// account_exist = await user_account_exists(accountId);
// no account_exist to call registerOrderly.

const announceKey = async (accountId: string) => {
  const account = await near.account(accountId);

  await account.functionCall(ORDERLY_ASSET_MANAGER, 'user_announce_key', {});
};

const storageDeposit = async (accountId: string) => {
  const storage_amount = await get_storage_deposit_amount(accountId);

  // if (storage_amount !== null) {
  const deposit_functionCall = orderly_storage_deposit(
    accountId,
    REGISTER_DEPOSIT_AMOUNT,
    false
  );

  const transaction: Transaction = {
    receiverId: ORDERLY_ASSET_MANAGER,
    functionCalls: [deposit_functionCall],
  };

  return signAndSendTransactions([transaction]);
  // }
};

const registerOrderly = async (accountId: string) => {
  // let wsTransactions: WSTransaction[] = [];

  const account = await near.account(accountId);

  // const account_exist = await user_account_exists(accountId);

  // already exist return []
  // if (!!account_exist) return;

  // const storage_amount = await get_storage_deposit_amount(accountId);

  // // if (storage_amount !== null) {
  // const deposit_functionCall = orderly_storage_deposit(
  //   accountId,
  //   REGISTER_DEPOSIT_AMOUNT,
  //   false
  // );

  await account.functionCall(ORDERLY_ASSET_MANAGER, 'user_announce_key', {});

  await account.functionCall(
    ORDERLY_ASSET_MANAGER,
    'user_request_set_trading_key',
    {
      key: getNormalizeTradingKey(),
    }
  );

  // // set functionCall key and set trading key
  // transactions.push({
  //   receiverId: ORDERLY_ASSET_MANAGER,
  //   functionCalls: [user_announce_key(), user_request_set_trading_key()],
  // });

  // return signAndSendTransaction(wsTransactions[0]);

  // return signAndSendTransactions(wsTransactions);
};

const depositNEAR = async (amount: string) => {
  const transactions: Transaction[] = [];

  transactions.push({
    receiverId: ORDERLY_ASSET_MANAGER,
    functionCalls: [await user_deposit_native_token(amount)],
  });

  return signAndSendTransactions(transactions);
};

const depositFT = async (token: string, amount: string) => {
  const transactions: Transaction[] = [];

  const metaData = await getFTmetadata(token);

  transactions.push({
    receiverId: token,
    functionCalls: [
      await deposit_exact_token(
        toNonDivisibleNumber(metaData.decimals, amount)
      ),
    ],
  });

  return signAndSendTransactions(transactions);
};

export {
  signAndSendTransactions,
  registerOrderly,
  announceKey,
  storageDeposit,
  depositNEAR,
  depositFT,
  signAndSendTransaction,
};
