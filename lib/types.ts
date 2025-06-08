// lib/types.ts
export interface SimplifiedTransaction {
  tx_hash: string;
  chain: string;
  timestamp: number;
  user: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  action: 'Swap' | 'Transfer' | 'Approval' | 'Other';
  sent?: {
    token: string;
    amount: string;
    logo?: string;
  };
  received?: {
    token: string;
    amount: string;
    logo?: string;
  };
  usd_value?: number;
}

// You can add other shared types here in the future 