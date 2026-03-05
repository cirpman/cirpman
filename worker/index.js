
/**
 * CIRPMAN HOMES - STANDALONE WORKER (ZERO DEPENDENCIES)
 */

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

async function getS3PresignedUrl({ bucket, key, accountId, accessKey, secretKey, contentType }) {
  const region = "auto";
  const service = "s3";
  const datetime = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "");
  const date = datetime.slice(0, 8);
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const expiry = 3600;

  const queryParams = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${encodeURIComponent(`${accessKey}/${date}/${region}/${service}/aws4_request`)}`,
    `X-Amz-Date=${datetime}`,
    `X-Amz-Expires=${expiry}`,
    `X-Amz-SignedHeaders=host%3Bx-amz-content-sha256`,
  ].sort().join("&");

  const canonicalRequest = ["PUT", `/${key}`, queryParams, `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\n`, "host;x-amz-content-sha256", "UNSIGNED-PAYLOAD"].join("\n");
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

const handleRequest = async (request, env) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
    "Content-Type": "application/json"
  };

  if (method === "OPTIONS") return new Response(null, { status: 204, headers });

  const jsonResp = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });

  const auth = async () => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    return await verifyJWT(authHeader.split(" ")[1], env.JWT_SECRET || "fallback");
  };

  const adminOnly = async () => {
    const user = await auth();
    if (user?.role !== 'admin') return null;
    return user;
  };

  try {
    // --- Auth Endpoints ---
    if (path === "/signup" && method === "POST") {
      const { email, password, fullName, phone } = await request.json();
      const id = crypto.randomUUID();
      await env.DB.prepare("INSERT INTO profiles (id, full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)").bind(id, fullName, email, phone, btoa(password), 'client').run();
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

    // --- Admin Stats ---
    if (path === "/admin/stats" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const users = await env.DB.prepare("SELECT COUNT(*) as c FROM profiles").first("c");
      const props = await env.DB.prepare("SELECT COUNT(*) as c FROM properties").first("c");
      const visits = await env.DB.prepare("SELECT COUNT(*) as c FROM site_visit_bookings").first("c");
      const subs = await env.DB.prepare("SELECT (SELECT COUNT(*) FROM newsletter_subscriptions) + (SELECT COUNT(*) FROM customer_subscriptions) as c").first("c");
      return jsonResp({ clients: users, properties: props, siteVisits: visits, revenue: 0, subscriptions: subs });
    }

    // --- Properties Management ---
    if (path === "/get-properties" && method === "POST") {
      const { results } = await env.DB.prepare("SELECT * FROM properties ORDER BY created_at DESC").all();
      return jsonResp(results.map(p => ({ ...p, images: JSON.parse(p.images || '[]'), videos: JSON.parse(p.videos || '[]'), installment_config: JSON.parse(p.installment_config || '{}') })));
    }

    if (path === "/create-property" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const data = await request.json();
      const res = await env.DB.prepare("INSERT INTO properties (title, description, location, google_maps, size_min, size_max, price_min, price_max, status, progress, featured_image, images, videos, installment_available, installment_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        data.title, data.description, data.location, data.google_maps, data.size_min, data.size_max, data.price_min, data.price_max, data.status, data.progress, data.featured_image, JSON.stringify(data.images || []), JSON.stringify(data.videos || []), data.installment_available ? 1 : 0, JSON.stringify(data.installment_config || {})
      ).run();
      return jsonResp({ success: true, id: res.meta.last_row_id });
    }

    if (path === "/update-property" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const data = await request.json();
      await env.DB.prepare("UPDATE properties SET title=?, description=?, location=?, google_maps=?, size_min=?, size_max=?, price_min=?, price_max=?, status=?, progress=?, featured_image=?, images=?, videos=?, installment_available=?, installment_config=? WHERE id=?").bind(
        data.title, data.description, data.location, data.google_maps, data.size_min, data.size_max, data.price_min, data.price_max, data.status, data.progress, data.featured_image, JSON.stringify(data.images || []), JSON.stringify(data.videos || []), data.installment_available ? 1 : 0, JSON.stringify(data.installment_config || {}), data.id
      ).run();
      return jsonResp({ success: true });
    }

    if (path === "/delete-property" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { id } = await request.json();
      await env.DB.prepare("DELETE FROM properties WHERE id = ?").bind(id).run();
      return jsonResp({ success: true });
    }

    // --- Clients Management ---
    if (path === "/get-profiles" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { results } = await env.DB.prepare("SELECT id, full_name, email, phone, role, created_at FROM profiles").all();
      return jsonResp(results);
    }

    if (path === "/update-user-role" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { userId, newRole } = await request.json();
      await env.DB.prepare("UPDATE profiles SET role = ? WHERE id = ?").bind(newRole, userId).run();
      return jsonResp({ success: true });
    }

    // --- Testimonials Management ---
    if (path === "/get-testimonials" && method === "POST") {
      const { results } = await env.DB.prepare("SELECT * FROM testimonials ORDER BY created_at DESC").all();
      return jsonResp(results);
    }

    if (path === "/create-testimonial" && method === "POST") {
      const data = await request.json();
      await env.DB.prepare("INSERT INTO testimonials (client_name, client_title, client_company, testimonial_text, rating, featured, status, client_photo_url, property_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        data.client_name, data.client_title, data.client_company, data.testimonial_text, data.rating, data.featured ? 1 : 0, data.status || 'pending', data.client_photo_url, data.property_id
      ).run();
      return jsonResp({ success: true });
    }

    if (path === "/update-testimonial" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const data = await request.json();
      await env.DB.prepare("UPDATE testimonials SET client_name=?, client_title=?, client_company=?, testimonial_text=?, rating=?, featured=?, status=?, client_photo_url=?, property_id=? WHERE id=?").bind(
        data.client_name, data.client_title, data.client_company, data.testimonial_text, data.rating, data.featured ? 1 : 0, data.status, data.client_photo_url, data.property_id, data.id
      ).run();
      return jsonResp({ success: true });
    }

    if (path === "/delete-testimonial" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { testimonialId } = await request.json();
      await env.DB.prepare("DELETE FROM testimonials WHERE id = ?").bind(testimonialId).run();
      return jsonResp({ success: true });
    }

    if (path === "/update-testimonial-status" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { testimonialId, newStatus } = await request.json();
      await env.DB.prepare("UPDATE testimonials SET status = ? WHERE id = ?").bind(newStatus, testimonialId).run();
      return jsonResp({ success: true });
    }

    // --- Blog Management ---
    if (path === "/get-blog-posts" && method === "POST") {
      const { results } = await env.DB.prepare("SELECT * FROM blog_posts ORDER BY created_at DESC").all();
      return jsonResp(results);
    }

    if (path === "/create-blog-post" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { title, content, author } = await request.json();
      await env.DB.prepare("INSERT INTO blog_posts (title, content, author) VALUES (?, ?, ?)").bind(title, content, author).run();
      return jsonResp({ success: true });
    }

    if (path === "/update-blog-post" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { id, title, content, author } = await request.json();
      await env.DB.prepare("UPDATE blog_posts SET title=?, content=?, author=? WHERE id=?").bind(title, content, author, id).run();
      return jsonResp({ success: true });
    }

    if (path === "/delete-blog-post" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { id } = await request.json();
      await env.DB.prepare("DELETE FROM blog_posts WHERE id = ?").bind(id).run();
      return jsonResp({ success: true });
    }

    // --- FAQ Management ---
    if (path === "/get-faqs" && method === "POST") {
      const { results } = await env.DB.prepare("SELECT * FROM faqs ORDER BY order_index ASC").all();
      return jsonResp(results);
    }

    if (path === "/create-faq" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { question, answer, order_index } = await request.json();
      await env.DB.prepare("INSERT INTO faqs (question, answer, order_index) VALUES (?, ?, ?)").bind(question, answer, order_index || 0).run();
      return jsonResp({ success: true });
    }

    if (path === "/update-faq" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { id, question, answer, order_index } = await request.json();
      await env.DB.prepare("UPDATE faqs SET question=?, answer=?, order_index=? WHERE id=?").bind(question, answer, order_index, id).run();
      return jsonResp({ success: true });
    }

    if (path === "/delete-faq" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { id } = await request.json();
      await env.DB.prepare("DELETE FROM faqs WHERE id = ?").bind(id).run();
      return jsonResp({ success: true });
    }

    if (path === "/toggle-faq-status" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { id, is_active } = await request.json();
      await env.DB.prepare("UPDATE faqs SET is_active = ? WHERE id = ?").bind(is_active ? 1 : 0, id).run();
      return jsonResp({ success: true });
    }

    // --- Feedback & Subscriptions ---
    if (path === "/create-feedback" && method === "POST") {
      const { name, email, message } = await request.json();
      await env.DB.prepare("INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)").bind(name, email, message).run();
      return jsonResp({ success: true });
    }

    if (path === "/get-feedbacks" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { results } = await env.DB.prepare("SELECT * FROM feedback ORDER BY created_at DESC").all();
      return jsonResp(results);
    }

    if (path === "/update-feedback-status" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { feedbackId, newStatus } = await request.json();
      await env.DB.prepare("UPDATE feedback SET status = ? WHERE id = ?").bind(newStatus, feedbackId).run();
      return jsonResp({ success: true });
    }

    if (path === "/reply-to-feedback" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { feedbackId, replyMessage } = await request.json();
      await env.DB.prepare("UPDATE feedback SET reply_message = ?, replied_at = CURRENT_TIMESTAMP, status = 'replied' WHERE id = ?").bind(replyMessage, feedbackId).run();
      return jsonResp({ success: true });
    }

    if (path === "/get-newsletter-subscriptions" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { results } = await env.DB.prepare("SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC").all();
      return jsonResp(results);
    }

    if (path === "/get-customer-subscriptions" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { results } = await env.DB.prepare("SELECT * FROM customer_subscriptions ORDER BY created_at DESC").all();
      return jsonResp(results);
    }

    if (path === "/get-consultant-subscriptions" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { results } = await env.DB.prepare("SELECT * FROM consultant_subscriptions ORDER BY created_at DESC").all();
      return jsonResp(results);
    }

    // --- Site Visits ---
    if (path === "/create-site-visit-booking" && method === "POST") {
      const data = await request.json();
      await env.DB.prepare("INSERT INTO site_visit_bookings (user_id, property_id, name, email, phone, preferred_date, preferred_time, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
        data.user_id, data.property_id, data.name, data.email, data.phone, data.preferred_date, data.preferred_time, data.message
      ).run();
      return jsonResp({ success: true });
    }

    if (path === "/get-site-visit-bookings" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { results } = await env.DB.prepare("SELECT * FROM site_visit_bookings ORDER BY created_at DESC").all();
      return jsonResp(results);
    }

    if (path === "/update-site-visit-status" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { bookingId, newStatus } = await request.json();
      await env.DB.prepare("UPDATE site_visit_bookings SET follow_up_status = ? WHERE id = ?").bind(newStatus, bookingId).run();
      return jsonResp({ success: true });
    }

    // --- Gallery & Timeline ---
    if (path === "/get-gallery-items" && method === "POST") {
      const { results } = await env.DB.prepare("SELECT * FROM gallery ORDER BY created_at DESC").all();
      return jsonResp(results);
    }

    if (path === "/create-gallery-items" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { galleryItems } = await request.json();
      for (const item of galleryItems) {
        await env.DB.prepare("INSERT INTO gallery (title, description, category, image_url, video_url) VALUES (?, ?, ?, ?, ?)").bind(
          item.title, item.description, item.category, item.image_url, item.video_url
        ).run();
      }
      return jsonResp({ success: true });
    }

    if (path === "/delete-gallery-item" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { id } = await request.json();
      await env.DB.prepare("DELETE FROM gallery WHERE id = ?").bind(id).run();
      return jsonResp({ success: true });
    }

    if (path === "/get-progress-timeline-items" && method === "POST") {
      const { results } = await env.DB.prepare("SELECT * FROM progress_timeline ORDER BY date DESC").all();
      return jsonResp(results);
    }

    if (path === "/create-progress-timeline-item" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const data = await request.json();
      await env.DB.prepare("INSERT INTO progress_timeline (title, description, date) VALUES (?, ?, ?)").bind(data.title, data.description, data.date).run();
      return jsonResp({ success: true });
    }

    if (path === "/delete-progress-timeline-item" && method === "POST") {
      if (!await adminOnly()) return jsonResp({ error: "Unauthorized" }, 401);
      const { id } = await request.json();
      await env.DB.prepare("DELETE FROM progress_timeline WHERE id = ?").bind(id).run();
      return jsonResp({ success: true });
    }

    // --- File Utils ---
    if (path === "/get-upload-url" && method === "POST") {
      const user = await auth();
      if (!user) return jsonResp({ error: "Unauthorized" }, 401);
      const { fileName, fileType } = await request.json();
      const key = `uploads/${user.userId}/${Date.now()}-${fileName}`;
      const signedUrl = await getS3PresignedUrl({ bucket: env.R2_BUCKET_NAME, key, accountId: env.R2_ACCOUNT_ID, accessKey: env.R2_ACCESS_KEY_ID, secretKey: env.R2_SECRET_ACCESS_KEY, contentType: fileType });
      return jsonResp({ url: signedUrl, key, publicUrl: `${env.R2_PUBLIC_URL}/${key}` });
    }

    return jsonResp({ error: "Route not found (" + path + ")" }, 404);
  } catch (err) { return jsonResp({ error: err.message }, 500); }
};

export default { fetch: handleRequest };
