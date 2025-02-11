import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'tailwind-variants';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
	return str[0].toUpperCase() + str.slice(1);
}

export function getIncrementedName(baseName: string, existingNames: string[]): string {
	let counter = 1;
	let name = `${baseName}${counter.toString().padStart(2, '0')}`;
	while (existingNames.includes(name)) {
		counter++;
		name = `${baseName}${counter.toString().padStart(2, '0')}`;
	}
	return name;
}

export function undefineExtras<T extends object>(obj: T): Omit<T, 'createdAt' | 'updatedAt' | 'apiKeys' | 'models'> {
	return {
		...obj,
		createdAt: undefined,
		updatedAt: undefined,
		apiKeys: undefined,
		models: undefined
	};
}

export function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

export function errorToMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return 'Unknown error';
}

export const newConversation = (userID: string, assistant?: string): ConversationInterface => ({
	userID,
	assistant
});

type MappableInterface =
	| ProviderInterface
	| ModelInterface
	| ApiKeyInterface
	| AssistantInterface
	| MessageInterface
	| ConversationInterface
	| UserInterface
	| ConversationInterface;

export function toIdMap<T extends MappableInterface>(array: Array<T>) {
	// [ {id:a, ...}, {id:b, ...} ] => {a: {id:a, ...}, b: {id:b, ...}}
	return array.reduce<{ [key: string]: T }>((acc, cur) => {
		if (!cur.id) throw new Error('Missing ID: ' + cur);
		acc[cur.id] = cur;
		return acc;
	}, {});
}

export function censorKey(dbUser: UserInterface | undefined, key: ApiKeyInterface) {
	if (dbUser?.admin || key.userID === dbUser?.id) return key;
	return { ...key, key: `${key.key.slice(0, 5)}...${key.key.slice(-2)}` };
}

export function fixNumberInput(e: Event, min: number = 0, max: number = 1) {
	const target = e.target as HTMLInputElement;
	const value: number = Number(target.value);

	if (isNaN(value)) {
		target.value = min.toString();
	} else if (value > max) {
		target.value = max.toString();
	} else if (value < min) {
		target.value = min.toString();
	}
	target.dispatchEvent(new Event('input', { bubbles: true }));
}

export async function promptHash(text: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(text);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
		.slice(0, 16);
}
