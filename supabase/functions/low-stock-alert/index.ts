import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface WebhookPayload {
  type: "UPDATE";
  table: string;
  record: {
    id: string;
    name: string;
    stock_qty: number;
    low_stock_threshold: number | null;
  };
  old_record: {
    stock_qty: number;
  };
}

serve(async (req: Request) => {
  const sendgridKey = Deno.env.get("SENDGRID_API_KEY");
  const operatorEmail = Deno.env.get("OPERATOR_EMAIL");
  const fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL");

  if (!sendgridKey || !operatorEmail || !fromEmail) {
    return new Response("Missing env vars", { status: 500 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { record } = payload;

  // Only alert when threshold is set and stock is at or below it
  if (
    record.low_stock_threshold === null ||
    record.stock_qty > record.low_stock_threshold
  ) {
    return new Response("No alert needed", { status: 200 });
  }

  const body = JSON.stringify({
    personalizations: [{ to: [{ email: operatorEmail }] }],
    from: { email: fromEmail },
    subject: `Low Stock Alert: ${record.name}`,
    content: [
      {
        type: "text/plain",
        value: `Ingredient "${record.name}" is running low.\n\nCurrent stock: ${record.stock_qty}\nThreshold: ${record.low_stock_threshold}\n\nPlease restock soon.`,
      },
    ],
  });

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendgridKey}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("SendGrid error:", text);
    return new Response("Failed to send email", { status: 502 });
  }

  return new Response("Alert sent", { status: 200 });
});
