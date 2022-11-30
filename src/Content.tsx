import React, { useCallback } from 'react';
import { useWalletSelector } from './WalletSelectorContext';
import { providers } from 'near-api-js';
import { AccountView, AccessKeyView } from 'near-api-js/lib/providers/provider';
import getConfig from './config';
import { useEffect } from 'react';
import { near, keyStore } from './near';
import {
  STORAGE_TO_REGISTER_WITH_MFT,
  getOrderlySignature,
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
import { announceKey, registerOrderly } from './orderly/api';
import { find_orderly_functionCall_key } from './orderly/utils';
export type Account = AccountView & {
  account_id: string;
};

export default function Content() {
  const { modal, accountId, selector } = useWalletSelector();

  const getAccessKey = useCallback(async () => {
    if (!accountId) return null;
    const nearConnection = await near.account(accountId);

    const key = await find_orderly_functionCall_key(accountId);

    console.log({
      allkeys: await nearConnection.getAccessKeys(),
    });

    console.log({ key });

    getOrderlySignature(accountId).then((res) => {
      console.log({
        signa: res,
      });
    });

    get_user_trading_key(accountId).then((res) => {
      console.log({ res });
    });

    // get_user_trading_key(accountId).then((res) => {
    //   console.log({
    //     trading_ley: res,
    //   });

    // });

    const keyPub = await keyStore.getKey('testnet', accountId);

    console.log({ keyPub: keyPub.getPublicKey().toString() });

    return storage_balance_of(accountId);

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
    getAccessKey().then((res) => {
      console.log(res);
    });

    get_listed_tokens().then((res) => {
      console.log({
        token_list: res,
      });
    });
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
          await announceKey(accountId);
        }}
        className="text-center"
      >
        {'announce key'}
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
    </div>
  );
}
