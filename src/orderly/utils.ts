import { ec } from 'elliptic';
import { near, config, orderlyViewFunction, keyStore } from '../near';
import getConfig from '../config';
import bs58 from 'bs58';
import { base_decode, base_encode } from 'near-api-js/lib/utils/serialize';
import keccak256 from 'keccak256';
import { Buffer } from 'buffer';
import { KeyPair } from 'near-api-js';

export const STORAGE_TO_REGISTER_WITH_MFT = '0.1';

export type OFF_CHAIN_METHOD = 'POST' | 'GET' | 'DELETE';

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

export const generateMessage = (
  time_stamp: number,
  method: OFF_CHAIN_METHOD,
  url: string,
  body: object
) => {
  return !!body
    ? `${time_stamp}${method}${url}${JSON.stringify(body)}`
    : `${time_stamp}${method}${url}`;
};

// const message = `1649920583000POST/v1/order${JSON.stringify({
//   symbol: 'SPOT_NEAR_USDC',
//   order_type: 'LIMIT',
//   order_price: 15.23,
//   order_quantity: 23.11,
//   side: 'BUY',
//   signature:
//     'fc3c41d988dd03a65a99354a7b1d311a43de6b7a7867bdbdaf228bb74a121f8e47bb15ff7f69eb19c96da222f651da53b5ab30fb7caf69a76f01ad9af06c154400',
// })}`;

export const generateOrderlySignatureHeader = async ({
  accountId,
  time_stamp,
  url,
  body,
  method,
}: {
  accountId: string;
  time_stamp: number;
  url: string;
  body: object;
  method: OFF_CHAIN_METHOD;
}) => {
  const message = generateMessage(time_stamp, method, url, body);

  const keyPair = await keyStore.getKey(getConfig().networkId, accountId);

  // const publicKeyBytes = bs58.decode(publicKey.replace('ed25519:', ''));

  // const privateKeyBytes = bs58.decode(privateKey.replace('ed25519:', ''));

  const signature = keyPair.sign(Buffer.from(message)).signature;

  // return atob(signature.toString());

  return new Buffer(signature)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const generateOrderSignature = async ({}: {}) => {};

export const toReadableNumber = (
  decimals: number,
  number: string = '0'
): string => {
  if (!decimals) return number;

  const wholeStr = number.substring(0, number.length - decimals) || '0';
  const fractionStr = number
    .substring(number.length - decimals)
    .padStart(decimals, '0')
    .substring(0, decimals);

  return `${wholeStr}.${fractionStr}`.replace(/\.?0+$/, '');
};

export const toNonDivisibleNumber = (
  decimals: number,
  number: string
): string => {
  if (decimals === null || decimals === undefined) return number;
  const [wholePart, fracPart = ''] = number.split('.');

  return `${wholePart}${fracPart.padEnd(decimals, '0').slice(0, decimals)}`
    .replace(/^0+/, '')
    .padStart(1, '0');
};
