import { ec } from 'elliptic';
import keccak256 from 'keccak256';
import { near, config, orderlyViewFunction, keyStore } from '../near';
import getConfig from '../config';
import bs58 from 'bs58';
import { base_decode, base_encode } from 'near-api-js/lib/utils/serialize';

import { Buffer } from 'buffer';

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

export const getPublicKey = async (accountId: string) => {
  const publicKey = (await keyStore.getKey(getConfig().networkId, accountId))
    .getPublicKey()
    .toString();

  return publicKey;
};

export const getLocalPrivateKey = (
  accountId: string,
  prefix: string = 'near-api-js'
) => {
  return localStorage.getItem(
    `${prefix}:keystore:${accountId}:${getConfig().networkId}`
  );
};

// get signature function
export const getOrderlySignature = async (accountId: string) => {
  const message = `1649920583000POST/v1/order${JSON.stringify({
    symbol: 'SPOT_NEAR_USDC',
    order_type: 'LIMIT',
    order_price: 15.23,
    order_quantity: 23.11,
    side: 'BUY',
    signature:
      'fc3c41d988dd03a65a99354a7b1d311a43de6b7a7867bdbdaf228bb74a121f8e47bb15ff7f69eb19c96da222f651da53b5ab30fb7caf69a76f01ad9af06c154400',
  })}`;

  console.log(message);
  const keyPair = await keyStore.getKey(getConfig().networkId, accountId);

  const publicKey = await getPublicKey(accountId);

  const privateKey = getLocalPrivateKey(accountId);

  const publicKeyBytes = bs58.decode(publicKey.replace('ed25519:', ''));

  const privateKeyBytes = bs58.decode(privateKey.replace('ed25519:', ''));

  const signature = keyPair.sign(Buffer.from(message)).signature;

  console.log(
    new Buffer(signature).toString('base64').replace('+', '-').replace('/', '_')
  );

  // return atob(signature.toString());

  return keyPair.verify(Buffer.from(message, 'utf-8'), signature);
};
