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
  getKline,
} from './orderly/off-chain-api';

import { AdvancedChart } from 'react-tradingview-embed';
import { batchCreateOrder } from './orderly/off-chain-api';
import { useOrderlyPrivateData } from './orderly/off-chain-ws';
import { useOrderlyMarketData } from './orderly/off-chain-ws';
import { useOrderlyWS, useOrderlyPingPong } from './orderly/off-chain-ws';
import {
  cancelOrders,
  cancelOrderByClientId,
  editOrder,
} from './orderly/off-chain-api';
import {
  getOrderByOrderId,
  getOrderBook,
  deleteOrderly,
  cancelOrder,
} from './orderly/off-chain-api';
import {
  getAssetHistory,
  getOrders,
  getOrderByClientId,
} from './orderly/off-chain-api';

export type Account = AccountView & {
  account_id: string;
};

export default function Content() {
  const { modal, accountId, selector } = useWalletSelector();

  // const pingPongprivate = useOrderlyPrivatePingPong();

  // const marketData = useOrderlyMarketData({
  //   symbol: 'SPOT_NEAR_USDC',
  // });

  const auth = useOrderlyPrivateData();

  // const auth = useOrderlyAuth();

  // const orderbook = useOrderlyOrderbook({
  //   symbol: 'SPOT_NEAR_USDC',
  // });

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
            orderlyProps: {
              symbol: 'SPOT_NEAR_USDC',
              side: 'BUY',
              order_type: 'LIMIT',
              order_price: 15.23,
              order_quantity: 23.11,
              client_order_id: 'test_client_id',
            },
            accountId,
          });
        }}
        className="border border-black"
      >
        create order SPOT_NEAR_USDC LIMIT price 15.23 order_quantity 23.11 side
        BUY <br />
        client_id: test_client_id
      </button>

      <button
        onClick={async () => {
          return getAssetHistory({
            accountId,
          });
        }}
      >
        get asset history
      </button>

      <button
        onClick={async () => {
          return getOrders({
            accountId,
          });
        }}
      >
        get orders
      </button>

      <button
        onClick={async () => {
          return getOrderByOrderId({
            accountId,
            order_id: 10113346,
          });
        }}
      >
        get order by id: 10113346
      </button>

      <button
        onClick={async () => {
          return getOrderByClientId({
            accountId,
            client_order_id: 'test_client_id',
          });
        }}
      >
        get orders by client_order_id: test_client_id
      </button>

      <button
        onClick={async () => {
          await getKline({
            accountId,
            KlineParams: {
              symbol: 'SPOT_NEAR_USDC',
              type: '1h',
            },
          });
        }}
      >
        get 1h k line SPOT_NEAR_USDC
      </button>

      <button
        onClick={() => {
          return getOrderBook({
            accountId,
            symbol: 'SPOT_NEAR_USDC',
          });
        }}
      >
        get orderbook on symbol SPOT_NEAR_USDC
      </button>

      <button
        onClick={() => {
          return cancelOrder({
            accountId,
            DeleteParams: {
              symbol: 'SPOT_NEAR_USDC',
              order_id: 10113346,
            },
          });
        }}
      >
        cancel order id: 10113346
      </button>

      <button
        onClick={() => {
          return cancelOrders({
            accountId,
            DeleteParams: {
              symbol: 'SPOT_NEAR_USDC',
            },
          });
        }}
      >
        cancel orders
      </button>

      <button
        onClick={() => {
          return cancelOrderByClientId({
            accountId,
            DeleteParams: {
              symbol: 'SPOT_NEAR_USDC',
              client_order_id: 'test_client_id',
            },
          });
        }}
      >
        cancel order by client id: test_client_id
      </button>

      <button
        onClick={async () => {
          await editOrder({
            orderlyProps: {
              symbol: 'SPOT_NEAR_USDC',
              side: 'BUY',
              order_type: 'LIMIT',
              order_price: 100,
              order_quantity: 23.11,
              client_order_id: 'test_client_id',
              order_id: 10113350,
            },
            accountId,
          });
        }}
        className="border border-black"
      >
        edit order SPOT_NEAR_USDC LIMIT price 15.23 order_quantity 23.11 side
        BUY <br />
        client_id: test_client_id
        <br />
        to price 100
      </button>

      <button
        onClick={async () => {
          await batchCreateOrder({
            orderlyProps: [
              {
                symbol: 'SPOT_NEAR_USDC',
                side: 'BUY',
                order_type: 'LIMIT',
                order_price: 200,
                order_quantity: 23.11,
                client_order_id: 'test_client_id_batch_0',
              },
            ],
            accountId,
          });
        }}
        className="border border-black"
      >
        batch create order SPOT_NEAR_USDC LIMIT price 200 order_quantity 23.11
        side BUY <br />
        client_id: test_client_id
      </button>

      {/* trading view */}
      {/* <div className="w-2/3">
        <AdvancedChart
          widgetProps={{
            theme: 'dark',
            symbol: 'BITMEX:ETHUSDT',
          }}
        />
      </div> */}
    </div>
  );
}
