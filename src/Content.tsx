import React, { useCallback } from 'react';
import { useWalletSelector } from './WalletSelectorContext';
import { providers } from 'near-api-js';
import { AccountView, AccessKeyView } from 'near-api-js/lib/providers/provider';
import getConfig from './config';
import { useEffect } from 'react';
import { near, keyStore } from './near';
import {
  STORAGE_TO_REGISTER_WITH_MFT,
  generateMessage,
  generateOrderSignature,
  generateTradingKeyPair,
} from './orderly/utils';
import {
  get_listed_tokens,
  get_user_trading_key,
  storage_balance_bounds,
  storage_balance_of,
  user_account_exists,
} from './orderly/on-chain-api';
import './app.pcss';
import {
  formatNearAmount,
  parseNearAmount,
} from 'near-api-js/lib/utils/format';
import {
  announceKey,
  storageDeposit,
  registerOrderly,
  depositNEAR,
  depositFT,
} from './orderly/api';
import { find_orderly_functionCall_key, getPublicKey } from './orderly/utils';
import {
  getOrderlyPublic,
  requestOrderly,
  createOrder,
} from './orderly/off-chain-api';
export type Account = AccountView & {
  account_id: string;
};

export default function Content() {
  const { modal, accountId, selector } = useWalletSelector();

  const test = useCallback(async () => {
    if (!accountId) return null;
    const nearConnection = await near.account(accountId);

    requestOrderly({
      url: '/v1/client/info',
      accountId,
    });

    requestOrderly({
      url: '/v1/client/holding?all=false',
      accountId,
    });

    // const trading_key = await get_user_trading_key(accountId);

    // console.log({
    //   trading_key,
    // });

    // generateOrderSignature(accountId);

    // console.log({
    //   keypair: generateTradingKeyPair(),
    // });

    // return find_orderly_functionCall_key(accountId);

    // const provider = new providers.JsonRpcProvider({
    //   url: getConfig().nodeUrl,
    // });

    // console.log({ publicKey });

    // const accessKey = await provider.query<AccessKeyView>({
    //   request_type: 'view_access_key',
    //   finality: 'final',
    //   account_id: accountId,
    //   public_key: publicKey.toString(),
    // });
  }, []);

  useEffect(() => {
    test();
  }, [accountId]);

  const handleSignOut = async () => {
    const wallet = await selector.wallet();
    return wallet.signOut();
  };

  const handlerRegister = async () => {
    return await registerOrderly(accountId);
  };

  return (
    <div className="flex  min-h-screen items-center p-5 flex-col  overflow-hidden">
      <button
        onClick={() => {
          return accountId ? handleSignOut() : modal.show();
        }}
        className="text-center"
      >
        {!!accountId ? accountId : 'Connect Wallet'}
      </button>

      <button
        onClick={async () => {
          return await handlerRegister();
        }}
        type="button"
        className="ml-2"
      >
        register orderly
      </button>

      <button
        onClick={async () => {
          const tradingKey = await get_user_trading_key(accountId);
          alert(tradingKey);
        }}
        type="button"
        className="ml-2"
      >
        show trading key
      </button>

      <button
        onClick={async () => {
          const tradingKey = await getPublicKey(accountId);
          alert(tradingKey);
        }}
        type="button"
        className="ml-2"
      >
        show public key
      </button>

      <button
        onClick={async () => {
          await storageDeposit(accountId);
        }}
        type="button"
        className="ml-2"
      >
        storage deposit 0.05N
      </button>

      <button
        onClick={async () => {
          const symbols = await getOrderlyPublic('/v1/public/info');

          console.log({
            symbols,
          });
        }}
        type="button"
        className="ml-2"
      >
        show all symbols
      </button>
      <button
        onClick={async () => {
          const list = await get_listed_tokens();
          console.log({ list });
        }}
        type="button"
        className="ml-2"
      >
        show whitelist tokens
      </button>

      <button
        onClick={async () => {
          await depositNEAR('10');
        }}
        type="button"
        className="ml-2"
      >
        deposit 10 NEAR to orderly
      </button>

      <button
        onClick={async () => {
          await depositFT('usdc.orderly.testnet', '10');
        }}
        type="button"
        className="ml-2"
      >
        deposit 10 usdc.orderly to orderly
      </button>

      <button
        onClick={async () => {
          await createOrder({
            symbol: 'SPOT_NEAR_USDC',
            side: 'BUY',
            order_type: 'LIMIT',
            order_price: 15.23,
            order_quantity: 23.11,
            accountId,
          });
        }}
      >
        create order SPOT_NEAR_USDC LIMIT price 15.23 order_quantity 23.11 side
        BUY{' '}
      </button>
    </div>
  );
}
