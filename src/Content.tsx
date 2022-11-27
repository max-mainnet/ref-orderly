import React, { useCallback } from 'react';
import { useWalletSelector } from './WalletSelectorContext';
import { providers } from 'near-api-js';
import { AccountView, AccessKeyView } from 'near-api-js/lib/providers/provider';
import getConfig from './config';
import { useEffect } from 'react';
import { near } from './near';
import { find_orderly_functionCall_key } from './orderly/utils';
import {
  add_functionCall_key,
  user_account_exists,
} from './orderly/on-chain-api';
import './app.pcss';
export type Account = AccountView & {
  account_id: string;
};

export default function Content() {
  const { modal, accountId, selector } = useWalletSelector();

  const getAccessKey = useCallback(async () => {
    if (!accountId) return null;
    const nearConnection = await near.account(accountId);

    return find_orderly_functionCall_key();

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

  const testFunc = useCallback(async () => {
    if (!accountId) return null;

    return user_account_exists(accountId);
  }, []);

  useEffect(() => {
    getAccessKey().then((res) => {
      console.log(res);
    });

    testFunc().then((res) => {
      console.log(res);
    });
  }, [accountId]);

  const handleSignOut = async () => {
    const wallet = await selector.wallet();
    return wallet.signOut();
  };

  const handleAddKey = async () => {
    return add_functionCall_key();
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
        onClick={() => {
          return handleAddKey();
        }}
        className="ml-2"
      >
        add orderly key
      </button>
    </div>
  );
}
