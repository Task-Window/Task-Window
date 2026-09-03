import { Resend } from "npm:resend@6";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");
const webhookSecret = Deno.env.get("TASK_WEBHOOK_SECRET") ?? "";
const adminEmail = Deno.env.get("TASK_WINDOW_ADMIN_EMAIL") ?? "";
const fromEmail = Deno.env.get("TASK_WINDOW_FROM_EMAIL") ?? "";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id?: string;
    title?: string;
    category?: string;
    description?: string;
    difficulty?: string;
    estimated_time?: string;
    budget?: number | string;
    status?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    deadline?: string;
  };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (webhookSecret && req.headers.get("x-task-webhook-secret") !== webhookSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!RESEND_API_KEY_OK()) return json({ error: "RESEND_API_KEY is not configured" }, 500);
  if (!fromEmail) return json({ error: "TASK_WINDOW_FROM_EMAIL is not configured" }, 500);

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (payload.type !== "INSERT" || payload.table !== "tasks") {
    return json({ ok: true, skipped: true });
  }

  const task = payload.record ?? {};
  const customerEmail = task.customer_email?.trim();
  const customerName = task.customer_name?.trim() || "there";
  const taskTitle = task.title?.trim() || "New task";
  const budget = task.budget ?? "Not specified";

  const emails = [];

  if (customerEmail) {
    emails.push(
      resend.emails.send({
        from: fromEmail,
        to: [customerEmail],
        subject: `Task received – ${taskTitle}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:650px;margin:auto">
            <h2>Thank you for posting your task!</h2>
            <p>Hi ${escapeHtml(customerName)},</p>
            <p>We have successfully received your task on <strong>Task-Window</strong>.</p>
            <p><strong>Task:</strong> ${escapeHtml(taskTitle)}</p>
            <p><strong>Category:</strong> ${escapeHtml(task.category || "Not specified")}</p>
            <p><strong>Budget:</strong> ₹${escapeHtml(String(budget))}</p>
            <p><strong>Deadline:</strong> ${escapeHtml(task.deadline || "Not specified")}</p>
            <p>Our team will review your request and contact you using the details you provided.</p>
            <p>Regards,<br><strong>Task-Window Team</strong></p>
          </div>
        `,
      })
    );
  }

  if (adminEmail) {
    emails.push(
      resend.emails.send({
        from: fromEmail,
        to: [adminEmail],
        subject: `New Task Posted – ${taskTitle}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:700px;margin:auto">
            <h2>New task received</h2>
            <p><strong>Task:</strong> ${escapeHtml(taskTitle)}</p>
            <p><strong>Client:</strong> ${escapeHtml(customerName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(customerEmail || "Not provided")}</p>
            <p><strong>WhatsApp/Phone:</strong> ${escapeHtml(task.customer_phone || "Not provided")}</p>
            <p><strong>Category:</strong> ${escapeHtml(task.category || "Not specified")}</p>
            <p><strong>Difficulty:</strong> ${escapeHtml(task.difficulty || "Not specified")}</p>
            <p><strong>Estimated time:</strong> ${escapeHtml(task.estimated_time || "Not specified")}</p>
            <p><strong>Budget:</strong> ₹${escapeHtml(String(budget))}</p>
            <p><strong>Deadline:</strong> ${escapeHtml(task.deadline || "Not specified")}</p>
            <hr>
            <p><strong>Description</strong></p>
            <p>${escapeHtml(task.description || "No description")}</p>
          </div>
        `,
      })
    );
  }

  if (!emails.length) return json({ ok: true, skipped: true, reason: "No recipient configured" });

  const results = await Promise.all(emails);
  const failures = results.filter((result) => result.error);

  if (failures.length) {
    console.error("Email delivery failure", failures);
    return json({ ok: false, failures }, 502);
  }

  return json({ ok: true, sent: results.length });
});

function RESEND_API_KEY_OK() {
  return Boolean(Deno.env.get("RESEND_API_KEY"));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
