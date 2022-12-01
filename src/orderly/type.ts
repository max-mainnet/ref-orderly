export interface orderlyOrder {
  symbol: string;
  client_order_id?: string;
  order_type: 'LIMIT' | 'MARKET' | 'IOC' | 'FOK' | 'POST_ONLY' | 'ASK' | 'BID';
  order_price?: number;
  order_quantity?: number;
  order_amount?: number;
  side: 'BUY' | 'SELL';
  signature: string;
  broker_id?: string;
  visible_quantity?: number;
}
