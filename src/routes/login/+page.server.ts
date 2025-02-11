import type { Provider } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';
import dbg from 'debug';
import type { Actions } from './$types';

const debug = dbg('app:login');

export const actions: Actions = {
	signup: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const { error: err } = await supabase.auth.signUp({ email, password });
		if (err) {
			return fail(400, { error: err.message });
		} else {
			redirect(303, '/login');
		}
	},

	login: async ({ request, locals, url }) => {
		const provider = url.searchParams.get('provider') as Provider;
		const formData = await request.formData();

		if (provider) {
			const { data, error: err } = await locals.supabase.auth.signInWithOAuth({
				provider,
				options: { redirectTo: url.origin + '/login/code' }
			});
			if (err) {
				debug(err);
				return fail(400, { providererror: err.message });
			} else {
				redirect(303, data.url);
			}
		}

		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email) return fail(400, { email, emailmissing: true });
		if (!password) return fail(400, { password, pwmissing: true });

		const authReponse = await locals.supabase.auth.signInWithPassword({ email, password });
		if (authReponse.error) {
			debug(authReponse.error);
			return fail(400, { email, incorrect: true });
		} else {
			locals.session = authReponse.data.session;
			locals.user = authReponse.data.user;
			redirect(303, '/chat');
		}
	},

	recover: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		if (!email) return fail(400, { email, emailmissing: true });

		debug('recover', email);
		const res = await supabase.auth.resetPasswordForEmail(email, { redirectTo: url.origin + '/login/code' });
		if (res.error) {
			debug('error', res.error);
			return fail(400, { error: res.error.message });
		}
		debug('recover', res);
		return { success: 'Recovery email sent' };
	},

	signout: async ({ locals }) => {
		const { error } = await locals.supabase.auth.signOut({ scope: 'local' });
		if (error) debug(error);

		locals.supabase.auth.signOut();
		redirect(303, '/login');
	},

	signoutAll: async ({ locals }) => {
		const { error } = await locals.supabase.auth.signOut({ scope: 'global' });
		if (error) debug(error);
		redirect(303, '/login');
	}
};
