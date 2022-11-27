import { providers, KeyPair, connect, WalletConnection } from 'near-api-js';

import {
  addKey,
  AddKey,
  functionCallAccessKey,
} from 'near-api-js/lib/transaction';

import { PublicKey } from 'near-api-js/lib/utils';
import {
  near,
  orderlyViewFunction,
  config,
  ORDERLY_ASSET_MANAGER,
  keyStore,
} from '../near';
import { getNormalizeTradingKey } from './utils';
import { executeMultipleTransactions, Transaction } from '../near';
import {
  find_orderly_functionCall_key,
  STORAGE_TO_REGISTER_WITH_MFT,
} from './utils';
import getConfig from '../config';

const is_token_listed = async (token: string) => {
  return orderlyViewFunction({
    methodName: 'is_token_listed',
    args: {
      token,
    },
  });
};

const add_functionCall_key = async () => {
  const account_id = await window.selector?.store?.getState()?.accounts[0]
    ?.accountId;

  if (!account_id) throw new Error('Please sign in first.');

  const keyPair = KeyPair.fromRandom('ed25519');

  const publicKey = keyPair.getPublicKey().toString();

  const account = await near.account(account_id);

  await keyStore.setKey(config.networkId, publicKey, keyPair);

  await account.addKey(publicKey, ORDERLY_ASSET_MANAGER);
};

//retrieve a list of whitelisted tokens supported by Orderly use the following method
const get_listed_tokens = async () => {
  return orderlyViewFunction({
    methodName: 'get_listed_tokens',
  });
};

const user_account_exists = async (user: string) => {
  return orderlyViewFunction({
    methodName: 'user_account_exists',
    args: {
      user,
    },
  });
};

const is_symbol_listed = async (pair_symbol: string) => {
  return orderlyViewFunction({
    methodName: 'is_symbol_listed',
    args: {
      pair_symbol,
    },
  });
};

const get_user_trading_key = async (user: string) => {
  const orderly_key = await find_orderly_functionCall_key();

  if (!orderly_key)
    throw new Error('Orderly key not found while viewing get_user_trading_key');

  return orderlyViewFunction({
    methodName: 'get_user_trading_key',
    args: {
      user,
      orderly_key,
    },
  });
};

const orderly_storage_deposit = async (account_id: string) => {
  return {
    methodName: 'storage_deposit',
    args: {
      registration_only: true,
      account_id,
    },
    gas: '30000000000000',
    amount: STORAGE_TO_REGISTER_WITH_MFT,
  };
};

const user_announce_key = async () => {
  return {
    methodName: 'user_announce_key',
    gas: '30000000000000',
  };
};

const user_request_set_trading_key = async () => {
  const key = getNormalizeTradingKey();

  return {
    methodName: 'user_request_set_trading_key',
    args: {
      key,
    },
    gas: '30000000000000',
  };
};

const storage_withdraw = async (amount: string) => {
  return {
    methodName: 'storage_withdraw',
    args: {
      amount,
    },
    gas: '30000000000000',
  };
};

const storage_balance_bounds = async () => {
  return orderlyViewFunction({
    methodName: 'storage_balance_bounds',
  });
};

const storage_balance_of = async () => {
  const account_id = await window.selector?.store?.getState()?.accounts[0]
    ?.accountId;

  if (!account_id) throw new Error('Please sign in first.');

  return orderlyViewFunction({
    methodName: 'storage_balance_of',
    args: {
      account_id,
    },
  });
};

// deposit near into a wallet
const user_deposit_native_token = async (amount: string) => {
  return {
    methodName: 'user_deposit_native_token',
    args: {
      amount,
    },
    gas: '30000000000000',
  };
};

const deposit_exact_token = async (token: string, amount: string) => {
  return {
    methodName: 'ft_transfer_call ',
    args: {
      receiver_id: token,
      amount,
    },
    gas: '30000000000000',
  };
};

const user_request_withdraw = async (token: string, amount: string) => {
  return {
    methodName: 'user_request_withdraw',
    args: {
      amount,
      token,
    },
    gas: '30000000000000',
  };
};

export {
  get_user_trading_key,
  get_listed_tokens,
  is_symbol_listed,
  is_token_listed,
  user_account_exists,
  orderly_storage_deposit,
  user_announce_key,
  user_request_set_trading_key,
  storage_balance_bounds,
  storage_balance_of,
  storage_withdraw,
  user_deposit_native_token,
  deposit_exact_token,
  user_request_withdraw,
  add_functionCall_key,
};
