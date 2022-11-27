import * as React from 'react';

import { WalletSelectorContextProvider } from './WalletSelectorContext';
import Content from './Content';
export const App = () => (
  <WalletSelectorContextProvider>
    <Content />
  </WalletSelectorContextProvider>
);
