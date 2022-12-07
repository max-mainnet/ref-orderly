export interface OrderlyOrder {
  symbol: string;
  client_order_id?: string;
  order_type: 'LIMIT' | 'MARKET' | 'IOC' | 'FOK' | 'POST_ONLY' | 'ASK' | 'BID';
  order_price?: number;
  order_quantity?: number;
  order_amount?: number;
  side: 'BUY' | 'SELL';
  broker_id?: string;
  visible_quantity?: number;
}

export interface EditOrderlyOrder extends OrderlyOrder {
  order_id: number;
}

export interface OrderWSConnection extends Record<string, any> {
  id?: string;
  event: 'ping' | 'auth' | 'request' | 'subscribe' | 'unsubscribe';
  topic?: string;
  params?: any;
}
