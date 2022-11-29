import { ec } from 'elliptic';

import keccak256 from 'keccak256';
import { near, config, orderlyViewFunction } from '../near';

export const STORAGE_TO_REGISTER_WITH_MFT = '0.1';

const generateTradingKeyPair = () => {
  const EC = new ec('secp256k1');
  const keyPair = EC.genKeyPair();

  return {
    privateKey: keyPair.getPrivate().toString('hex'),
    publicKey: keyPair.getPublic().encode('hex', false),
    keyPair,
  };
};

export const getNormalizeTradingKey = () => {
  const tradingKeyPair = generateTradingKeyPair();

  const pubKeyAsHex = tradingKeyPair.publicKey.replace('04', '');
  const normalizeTradingKey = window.btoa(
    keccak256(pubKeyAsHex).toString('hex')
  );

  return normalizeTradingKey;
};

// call to set trading_key
// await contract.user_request_set_trading_key({ key: normalizeTradingKey });

// find orderly functioncall key
export const find_orderly_functionCall_key = async (accountId: string) => {
  const nearConnection = await near.account(accountId);

  const allKeys = await nearConnection.getAccessKeys();

  const orderlyKey = allKeys.find(
    (key) =>
      key.access_key.permission !== 'FullAccess' &&
      key.access_key.permission.FunctionCall.receiver_id ===
        config.ORDERLY_ASSET_MANAGER
  );

  return orderlyKey;
};
