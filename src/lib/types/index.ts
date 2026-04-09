export interface User {
	id: string;
	email: string;
	username: string;
	display_name: string;
	avatar_url: string | null;
	role: 'user' | 'streamer' | 'admin';
	play_balance: number;
	bet_balance: number;
	referral_code: string;
	referred_by: string | null;
	created_at: string;
}

export interface Market {
	id: string;
	creator_id: string;
	title: string;
	description: string | null;
	status: 'draft' | 'open' | 'locked' | 'settled' | 'cancelled';
	pool_type: 'play' | 'bet';
	total_pool: number;
	rake_amount: number;
	lock_at: string | null;
	winning_outcome_id: string | null;
	created_at: string;
	updated_at: string;
	outcomes?: Outcome[];
}

export interface Outcome {
	id: string;
	market_id: string;
	label: string;
	sort_order: number;
	total_wagered: number;
}

export interface Bet {
	id: string;
	user_id: string;
	market_id: string;
	outcome_id: string;
	amount: number;
	payout: number | null;
	created_at: string;
}

export interface Activity {
	id: string;
	user_id: string;
	type: 'bet_placed' | 'market_created' | 'market_settled' | 'payout';
	metadata: Record<string, unknown>;
	created_at: string;
}

export interface LeaderboardEntry {
	user_id: string;
	username: string;
	display_name: string;
	avatar_url: string | null;
	net_profit: number;
	accuracy: number;
	total_wins: number;
	total_bets: number;
	volume: number;
	rank: number;
}

export interface RakeTier {
	minShare: number;
	maxShare: number;
	rakePercent: number;
}

export const RAKE_TIERS: RakeTier[] = [
	{ minShare: 0, maxShare: 50, rakePercent: 10 },
	{ minShare: 51, maxShare: 75, rakePercent: 7 },
	{ minShare: 76, maxShare: 89, rakePercent: 4 },
	{ minShare: 90, maxShare: 100, rakePercent: 1 }
];
