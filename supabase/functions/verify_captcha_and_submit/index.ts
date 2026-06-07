// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: verify_captcha_and_submit
// Validates Google reCAPTCHA token, applies rate limiting, then inserts payloads into tables

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type ActionType = 'feedback' | 'newsletter' | 'customer_subscription' | 'consultant_subscription' | 'site_visit';

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
		const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
		const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY');

		const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

		const { action, payload, recaptchaToken } = await req.json();
		if (!action || !payload) {
			return json({ error: 'Missing action or payload' }, 400);
		}

		// Verify reCAPTCHA if configured
		if (RECAPTCHA_SECRET_KEY) {
			if (!recaptchaToken) return json({ error: 'Missing reCAPTCHA token' }, 400);
			const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					secret: RECAPTCHA_SECRET_KEY,
					response: recaptchaToken
				}).toString()
			});
			const verifyJson = await verifyRes.json();
			if (!verifyJson.success || (typeof verifyJson.score === 'number' && verifyJson.score < 0.5)) {
				return json({ error: 'reCAPTCHA verification failed' }, 403);
			}
		}

		// Basic rate limiting: 5 requests / 15 minutes / IP + action
		const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
		const ua = req.headers.get('user-agent') || '';
		const windowMs = 15 * 60 * 1000;
		const now = Date.now();
		const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();

		const { data: existing } = await supabase
			.from('rate_limits')
			.select('*')
			.eq('ip', ip)
			.eq('action', action)
			.eq('window_start', windowStart)
			.maybeSingle();

		if (existing) {
			if (existing.count >= 5) {
				return json({ error: 'Rate limit exceeded. Please try again later.' }, 429);
			}
			await supabase.from('rate_limits').update({ count: existing.count + 1 }).eq('id', existing.id);
		} else {
			await supabase.from('rate_limits').insert({ ip, user_agent: ua, action, window_start });
		}

		// Route action
		switch (action as ActionType) {
			case 'feedback': {
				const { error } = await supabase.from('feedback').insert([payload]);
				if (error) return json({ error: error.message }, 400);
				return json({ ok: true });
			}
			case 'newsletter': {
				const { error } = await supabase.from('newsletter_subscriptions').insert([payload]);
				if (error) {
					if ((error as any).code === '23505') {
						return json({ ok: true, duplicated: true });
					}
					return json({ error: error.message }, 400);
				}
				return json({ ok: true });
			}
			case 'customer_subscription': {
				const { error } = await supabase.from('customer_subscriptions').insert([payload]);
				if (error) return json({ error: error.message }, 400);
				return json({ ok: true });
			}
			case 'consultant_subscription': {
				const { error } = await supabase.from('consultant_subscriptions').insert([payload]);
				if (error) return json({ error: error.message }, 400);
				return json({ ok: true });
			}
			case 'site_visit': {
				const { error } = await supabase.from('site_visit_bookings').insert([payload]);
				if (error) return json({ error: error.message }, 400);
				return json({ ok: true });
			}
			default:
				return json({ error: 'Unsupported action' }, 400);
		}
	} catch (e: any) {
		return json({ error: e?.message || 'Unexpected error' }, 500);
	}
});

function json(body: any, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders }
	});
}


