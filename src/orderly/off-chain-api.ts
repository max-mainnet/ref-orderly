import { getOrderlyConfig } from '../config';
import {
  getPublicKey,
  generateRequestSignatureHeader,
  get_orderly_private_key_path,
  get_orderly_public_key_path,
} from './utils';
import { OrderlyOrder, EditOrderlyOrder } from './type';
import { get_user_trading_key } from './on-chain-api';
import { ec } from 'elliptic';
import {
  generateOrderSignature,
  OFF_CHAIN_METHOD,
  formateParams,
} from './utils';

// get

export const getOrderlyHeaders = async ({
  url,
  accountId,
  trading,
  method,
  param,
  contentType,
}: {
  url?: string;
  accountId: string;
  trading?: boolean;
  method: OFF_CHAIN_METHOD;
  param?: object;
  contentType?: string;
}) => {
  const time_stamp = Date.now();

  const headers = {
    'Content-Type': contentType || 'application/x-www-form-urlencoded',
    'orderly-timestamp': `${time_stamp}`,
    'orderly-account-id': accountId,
    'orderly-key': await getPublicKey(accountId),
    'orderly-signature': await generateRequestSignatureHeader({
      accountId,
      time_stamp,
      url: url || '',
      body: param || null,
      method,
    }),
  };

  if (trading) {
    headers['orderly-trading-key'] = localStorage.getItem(
      get_orderly_public_key_path(accountId)
    );
  }

  return headers;
};

export const requestOrderly = async ({
  url,
  accountId,
  param,
}: {
  url?: string;
  accountId: string;
  param?: object;
}) => {
  const headers = await getOrderlyHeaders({
    url,
    accountId,
    trading: false,
    method: 'GET',
    param,
  });

  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'GET',
    headers,
  }).then((res) => {
    return res.json();
  });
};

export const tradingOrderly = async ({
  url,
  accountId,
  body,
  method,
}: {
  url?: string;
  accountId: string;
  body: object;
  method?: 'POST' | 'PUT';
}) => {
  const headers = await getOrderlyHeaders({
    url,
    accountId,
    trading: true,
    method: method || 'POST',
    param: body,
    contentType: 'application/json',
  });
  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: method || 'POST',
    headers,
    body: JSON.stringify(body),
  }).then((res) => {
    return res.json();
  });
};

export const deleteOrderly = async ({
  url,
  accountId,
  param,
}: {
  url?: string;
  accountId: string;
  param?: object;
}) => {
  const headers = await getOrderlyHeaders({
    url,
    accountId,
    trading: true,
    method: 'DELETE',
    contentType: 'application/x-www-form-urlencoded',
  });
  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'DELETE',
    headers,
  }).then((res) => {
    return res.json();
  });
};

export const createOrder = async (props: {
  accountId: string;
  orderlyProps: OrderlyOrder;
}) => {
  const { accountId } = props;

  const {
    symbol,
    client_order_id,
    order_type,
    order_price,
    order_quantity,
    order_amount,
    side,
    broker_id,
    visible_quantity,
  } = props.orderlyProps;

  //Note for DELETE requests, the parameters are not in the json body.
  // const message = Object.entries(props.orderlyProps)
  //   .filter(([k, v], i) => {
  //     return v !== undefined && v !== null;
  //   })
  //   .map(([k, v], i) => {
  //     if (typeof v === 'number') {
  //       return `${k}=${parseFloat(v.toString())}`;
  //     }
  //     return `${k}=${v}`;
  //   })
  //   .sort()
  //   .join('&');

  const message = formateParams(props.orderlyProps);

  const signature = generateOrderSignature(accountId, message);

  const body = {
    symbol,
    client_order_id,
    order_type,
    order_price,
    order_quantity,
    order_amount,
    side,
    broker_id,
    visible_quantity,
    signature,
  };

  return await tradingOrderly({
    accountId,
    url: '/v1/order',
    body,
  });
};

export const getAssetHistory = async (props: {
  accountId: string;
  HistoryParam?: {
    token?: string;
    side?: 'DEPOSIT' | 'WITHDRAW';
    status?: 'NEW' | 'CONFIRM' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    start_t?: number;
    end_t?: number;
    page?: number;
  };
}) => {
  const url = '/v1/asset/history';

  const res = requestOrderly({
    url,
    accountId: props.accountId,
    param: props.HistoryParam,
  });

  return res;
};

export const getOrders = async (props: {
  accountId: string;
  OrderProps?: {
    symbol?: string;
    side?: 'BUY' | 'SELL';
    order_type?: 'LIMIT' | 'MARKET';
    order_tag?: string;
    status?: 'NEW' | 'CONFIRM' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    start_t?: number;
    end_t?: number;
    page?: number;
    size?: number;
  };
}) => {
  const url = '/v1/orders';

  const res = requestOrderly({
    url,
    accountId: props.accountId,
    param: props.OrderProps,
  });

  return res;
};

export const getOrderByClientId = async (props: {
  accountId: string;
  client_order_id: string;
}) => {
  const url = `/v1/client/order/${props.client_order_id}`;

  const res = requestOrderly({
    url,
    accountId: props.accountId,
  });

  return res;
};

export const getOrderByOrderId = async (props: {
  accountId: string;
  order_id: number;
}) => {
  const url = `/v1/order/${props.order_id}`;

  const res = requestOrderly({
    url,
    accountId: props.accountId,
  });

  return res;
};

export const getKline = async (props: {
  accountId: string;
  KlineParams?: {
    symbol: string;
    type:
      | '1m'
      | '5m'
      | '15m'
      | '30m'
      | '1h'
      | '4h'
      | '12h'
      | '1d'
      | '1w'
      | '1mon'
      | '1y';
    limit?: number; //Maximum of 1000 klines.
  };
}) => {
  const url = `/v1/kline?${formateParams(props.KlineParams)}`;

  const res = requestOrderly({
    url,
    accountId: props.accountId,
  });

  return res;
};

export const getOrderBook = async (props: {
  accountId: string;
  symbol: string;
}) => {
  const url = `/v1/orderbook/${props.symbol}`;

  const res = requestOrderly({
    url,
    accountId: props.accountId,
  });

  return res;
};

export const cancelOrder = async (props: {
  accountId: string;
  DeleteParams: {
    symbol: string;
    order_id: number;
  };
}) => {
  const { accountId, DeleteParams } = props;

  const message = formateParams(DeleteParams);

  const signature = generateOrderSignature(accountId, message);

  const url = `/v1/order?${message}&signature=${signature}`;

  return deleteOrderly({
    url,
    accountId,
  });
};

export const cancelOrders = async (props: {
  accountId: string;
  DeleteParams: {
    symbol: string;
  };
}) => {
  const { accountId, DeleteParams } = props;

  const message = formateParams(DeleteParams);

  const signature = generateOrderSignature(accountId, message);

  const url = `/v1/orders?${message}&signature=${signature}`;

  return deleteOrderly({
    url,
    accountId,
  });
};

export const cancelOrderByClientId = async (props: {
  accountId: string;
  DeleteParams: {
    symbol: string;
    client_order_id: string;
  };
}) => {
  const { accountId, DeleteParams } = props;

  const message = formateParams(DeleteParams);

  const signature = generateOrderSignature(accountId, message);

  const url = `/v1/client/order?${message}&signature=${signature}`;

  return deleteOrderly({
    url,
    accountId,
  });
};

export const editOrder = async (props: {
  accountId: string;
  orderlyProps: EditOrderlyOrder;
}) => {
  const { accountId } = props;

  const {
    symbol,
    client_order_id,
    order_type,
    order_price,
    order_quantity,
    order_amount,
    side,
    broker_id,
    visible_quantity,
    order_id,
  } = props.orderlyProps;

  const message = formateParams(props.orderlyProps);

  const signature = generateOrderSignature(accountId, message);

  const body = {
    symbol,
    client_order_id,
    order_type,
    order_price,
    order_quantity,
    order_amount,
    side,
    order_id,
    broker_id,
    visible_quantity,
    signature,
  };

  return await tradingOrderly({
    accountId,
    url: '/v1/order',
    body,
    method: 'PUT',
  });
};

export const batchCreateOrder = async (props: {
  accountId: string;
  orderlyProps: OrderlyOrder[];
}) => {
  const { accountId } = props;

  //Note for DELETE requests, the parameters are not in the json body.
  // const message = Object.entries(props.orderlyProps)
  //   .filter(([k, v], i) => {
  //     return v !== undefined && v !== null;
  //   })
  //   .map(([k, v], i) => {
  //     if (typeof v === 'number') {
  //       return `${k}=${parseFloat(v.toString())}`;
  //     }
  //     return `${k}=${v}`;
  //   })
  //   .sort()
  //   .join('&');

  const messages = props.orderlyProps.map((p: OrderlyOrder) =>
    formateParams(p)
  );

  const body = messages.map((message, i) => {
    const signature = generateOrderSignature(accountId, message);

    return {
      ...props.orderlyProps[i],
      signature,
    };
  });

  return await tradingOrderly({
    accountId,
    url: '/v1/batch-order',
    body: {
      orders: body,
    },
    method: 'POST',
  });
};

export const getOrderlyPublic = async (url?: string) => {
  return await fetch(`${getOrderlyConfig().OFF_CHAIN_END_POINT}${url || ''}`, {
    method: 'GET',
  }).then((res) => {
    return res.json();
  });
};
