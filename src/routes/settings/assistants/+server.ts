import { db } from '$lib/db';
import { assistantsTable } from '$lib/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	const assistants = (await request.json()) as AssistantInterface[];
	console.log('/settings/assistants POST data', { data: assistants, locals });

	const user = locals.user;
	if (!user) {
		error(401, 'Unauthorized');
	}

	await db.transaction(async (tx) => {
		const userAssets = await tx.query.usersTable.findFirst({
			where: (table, { eq }) => eq(table.id, user.id),
			columns: { id: true },
			with: {
				providers: {
					columns: { id: true },
					with: {
						models: { columns: { id: true } },
						apiKeys: { columns: { id: true } }
					}
				},
				assistants: { columns: { id: true } }
			}
		});

		if (!userAssets) {
			error(404, 'User assets not found');
		}

		console.log('/settings/assistants POST userAssets', { userAssets });

		assistants.forEach((assistant) => {
			if (assistant.id && !userAssets.assistants.some((a) => a.id === assistant.id)) {
				error(403, 'Tried to update an assistant that does not belong to the user');
			}

			if (
				assistant.model &&
				!userAssets.providers.some((provider) => provider.models.some((model) => model.id === assistant.model))
			) {
				error(403, 'Tried to update an assistant with a model that does not belong to the user');
			}

			if (
				assistant.apiKey &&
				!userAssets.providers.some((provider) => provider.apiKeys.some((key) => key.id === assistant.apiKey))
			) {
				error(403, 'Tried to update an assistant with an API key that does not belong to the user');
			}
		});

		await tx
			.insert(assistantsTable)
			.values(assistants)
			.onConflictDoUpdate({
				target: [assistantsTable.id],
				set: {
					model: sql`excluded.model`,
					apiKey: sql`excluded.api_key`,
					name: sql`excluded.name`,
					about: sql`excluded.about`,
					aboutUser: sql`excluded.about_user`,
					aboutUserFromUser: sql`excluded.about_user_from_user`,
					assistantInstructions: sql`excluded.assistant_instructions`,
					assistantInstructionsFromUser: sql`excluded.assistant_instructions_from_user`,
					systemPrompt: sql`excluded.system_prompt`,
					images: sql`excluded.images`,
					audio: sql`excluded.audio`,
					video: sql`excluded.video`,
					prefill: sql`excluded.prefill`
				}
			})
			.returning({ id: assistantsTable.id });
	});

	return new Response();
};
