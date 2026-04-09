import { RAKE_TIERS } from '$lib/types';

export function calculateRake(
	winningSideShare: number,
	totalPool: number
): { rakePercent: number; rakeAmount: number } {
	const tier =
		RAKE_TIERS.find((t) => winningSideShare >= t.minShare && winningSideShare <= t.maxShare) ??
		RAKE_TIERS[RAKE_TIERS.length - 1];

	const rakePercent = tier.rakePercent;
	const rakeAmount = Math.floor(totalPool * (rakePercent / 100));

	return { rakePercent, rakeAmount };
}

export function formatBalance(amount: number): string {
	return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function generateReferralCode(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let code = '';
	for (let i = 0; i < 8; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

export function timeAgo(date: Date | string): string {
	const now = new Date();
	const past = new Date(date);
	const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}
