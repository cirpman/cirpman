
/**
 * CIRPMAN HOMES - STANDALONE WORKER (ZERO DEPENDENCIES)
 * ---------------------------------------------------
 * This worker includes a built-in router, JWT authentication logic, 
 * and manual S3 Signature V4 logic for R2 presigned URLs.
 * 
 * Paste this directly into the Cloudflare "Quick Edit" dashboard.
 */

// --- UTILS: Crypto & JWT ---
async function generateJWT(payload, secret) {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "");
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, "");
    const data = `${encodedHeader}.${encodedPayload}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    return `${data}.${encodedSignature}`;
}

async function verifyJWT(token, secret) {
    try {
        const [header, payload, signature] = token.split(".");
        const data = `${header}.${payload}`;
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
        const sigBuf = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(data));
        if (!isValid) return null;
        return JSON.parse(atob(payload));
    } catch (e) { return null; }
}

// --- UTILS: S3 Signature V4 (for R2 Presigned URLs) ---
async function getS3PresignedUrl({ bucket, key, accountId, accessKey, secretKey, contentType }) {
    const region = "auto";
    const service = "s3";
    const datetime = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "");
    const date = datetime.slice(0, 8);
    const endpoint = `${accountId}.r2.cloudflarestorage.com`;
    const host = `${bucket}.${endpoint}`;
    const expiry = 3600;

    const queryParams = [
        `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
        `X-Amz-Credential=${encodeURIComponent(`${accessKey}/${date}/${region}/${service}/aws4_request`)}`,
        `X-Amz-Date=${datetime}`,
        `X-Amz-Expires=${expiry}`,
        `X-Amz-SignedHeaders=host%3Bx-amz-content-sha256`,
    ].sort().join("&");

    const canonicalRequest = [
        "PUT",
        `/${key}`,
        queryParams,
        `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\n`,
        "host;x-amz-content-sha256",
        "UNSIGNED-PAYLOAD"
    ].join("\n");

    const hashedRequest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalRequest)))).map(b => b.toString(16).padStart(2, "0")).join("");
    const stringToSign = ["AWS4-HMAC-SHA256", datetime, `${date}/${region}/${service}/aws4_request`, hashedRequest].join("\n");

    const hmac = async (k, d) => await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode(d));
    const kDate = await hmac(new TextEncoder().encode("AWS4" + secretKey), date);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, "aws4_request");
    const signature = Array.from(new Uint8Array(await hmac(kSigning, stringToSign))).map(b => b.toString(16).padStart(2, "0")).join("");

    return `https://${host}/${key}?${queryParams}&X-Amz-Signature=${signature}`;
}

// --- ROUTER & HANDLERS ---
const handleRequest = async (request, env) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Global Headers (CORS)
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type": "application/json"
    };

    if (method === "OPTIONS") return new Response(null, { status: 204, headers });

    // Helper for JSON responses
    const jsonResp = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });

    // Auth Middleware
    const auth = async () => {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) return null;
        const payload = await verifyJWT(authHeader.split(" ")[1], env.JWT_SECRET || "fallback");
        return payload;
    };

    try {
        // --- ROUTES ---

        if (path === "/signup" && method === "POST") {
            const { email, password, fullName, phone } = await request.json();
            const id = crypto.randomUUID();
            const pwd_hash = btoa(password);
            await env.DB.prepare("INSERT INTO profiles (id, full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(id, fullName, email, phone, pwd_hash, 'client').run();
            const token = await generateJWT({ userId: id, role: 'client' }, env.JWT_SECRET);
            return jsonResp({ token, profile: { id, full_name: fullName, role: 'client' } });
        }

        if (path === "/login" && method === "POST") {
            const { email, password } = await request.json();
            const profile = await env.DB.prepare("SELECT * FROM profiles WHERE email = ?").bind(email).first();
            if (!profile || profile.password_hash !== btoa(password)) return jsonResp({ error: "Invalid credentials" }, 401);
            const token = await generateJWT({ userId: profile.id, role: profile.role }, env.JWT_SECRET);
            return jsonResp({ token, profile });
        }

        if (path === "/get-user-profile" && method === "POST") {
            const { userId } = await request.json();
            const profile = await env.DB.prepare("SELECT id, full_name, email, phone, role, created_at FROM profiles WHERE id = ?").bind(userId).first();
            return profile ? jsonResp(profile) : jsonResp({ error: "Not found" }, 404);
        }

        if (path === "/get-upload-url" && method === "POST") {
            const user = await auth();
            if (!user) return jsonResp({ error: "Unauthorized" }, 401);
            const { fileName, fileType } = await request.json();
            const key = `uploads/${user.userId}/${Date.now()}-${fileName}`;
            const signedUrl = await getS3PresignedUrl({
                bucket: env.R2_BUCKET_NAME,
                key,
                accountId: env.R2_ACCOUNT_ID,
                accessKey: env.R2_ACCESS_KEY_ID,
                secretKey: env.R2_SECRET_ACCESS_KEY,
                contentType: fileType
            });
            return jsonResp({ url: signedUrl, key, publicUrl: `${env.R2_PUBLIC_URL}/${key}` });
        }

        if (path === "/admin/stats" && method === "POST") {
            const user = await auth();
            if (user?.role !== 'admin') return jsonResp({ error: "Forbidden" }, 403);
            const users = await env.DB.prepare("SELECT COUNT(*) as c FROM profiles").first("c");
            const props = await env.DB.prepare("SELECT COUNT(*) as c FROM properties").first("c");
            const visits = await env.DB.prepare("SELECT COUNT(*) as c FROM site_visit_bookings").first("c");
            const subs = await env.DB.prepare("SELECT (SELECT COUNT(*) FROM newsletter_subscriptions) + (SELECT COUNT(*) FROM customer_subscriptions) as c").first("c");
            return jsonResp({ clients: users, properties: props, siteVisits: visits, revenue: 0, subscriptions: subs });
        }

        if (path === "/get-properties" && method === "POST") {
            const { results } = await env.DB.prepare("SELECT * FROM properties").all();
            return jsonResp(results);
        }

        // Default 404
        return jsonResp({ error: "Route not found" }, 404);

    } catch (err) {
        return jsonResp({ error: err.message, stack: err.stack }, 500);
    }
};

export default {
    fetch: handleRequest
};
