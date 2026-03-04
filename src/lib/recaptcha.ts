// Simple loader for Google reCAPTCHA v3 tokens
// Usage: const token = await getRecaptchaToken('feedback_submit')

export const loadRecaptchaScript = (siteKey: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined') return reject(new Error('Window not available'));
		if ((window as any).grecaptcha) return resolve();
		const scriptId = 'recaptcha-v3-script';
		const existing = document.getElementById(scriptId);
		if (existing) return resolve();
		const script = document.createElement('script');
		script.id = scriptId;
		script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
		document.head.appendChild(script);
	});
};

export const getRecaptchaToken = async (action: string): Promise<string | null> => {
	try {
		const siteKey = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY as string | undefined;
		if (!siteKey) return null; // Feature disabled if no key
		await loadRecaptchaScript(siteKey);
		return await new Promise<string>((resolve, reject) => {
			const grecaptcha = (window as any).grecaptcha;
			if (!grecaptcha) return reject(new Error('grecaptcha not available'));
			grecaptcha.ready(() => {
				grecaptcha.execute(siteKey, { action }).then(resolve).catch(reject);
			});
		});
	} catch (_) {
		return null;
	}
};


