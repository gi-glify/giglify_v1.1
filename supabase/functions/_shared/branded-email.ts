export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

export function messageHtml(message: string): string {
  return escapeHtml(message).split("\n").map((line) => line || "&nbsp;").join("<br />");
}

export function brandedHtml(recipientName: string, subject: string, message: string, unsubscribeUrl?: string): string {
  const safeName = escapeHtml(recipientName || "there");
  const safeSubject = escapeHtml(subject);
  const unsubscribe = unsubscribeUrl
    ? `<p style="margin:24px 0 0;font-size:12px;color:#64748b;">You are receiving this because you have a Giglify account. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#7c3aed;font-weight:700;">Unsubscribe from marketing emails</a>.</p>`
    : "";
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#faf8ff;color:#221b35;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
    <div style="padding:32px 16px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e8def7;border-radius:20px;overflow:hidden;box-shadow:0 12px 36px rgba(58,38,93,.10);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#24123f,#56308a);color:#ffffff;">
          <div style="display:flex;align-items:center;gap:10px;font-size:14px;font-weight:800;letter-spacing:2px;"><img src="https://giglify.co.ke/giglify.svg" width="30" height="30" alt="Giglify" style="display:block;border-radius:8px;" /> <span>GIGLIFY</span></div>
          <div style="margin-top:28px;font-size:12px;font-weight:700;letter-spacing:1px;color:#f4b740;">A MESSAGE FROM THE TEAM</div>
          <h1 style="margin:12px 0 0;font-size:30px;line-height:1.15;">${safeSubject}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 18px;font-size:16px;">Hi ${safeName},</p>
          <div style="font-size:16px;color:#4b405d;">${messageHtml(message)}</div>
          <div style="margin:28px 0 0;padding:18px 20px;border-radius:14px;background:#fff8e8;border:1px solid #f4d78c;color:#765016;font-size:14px;">Need anything else? Reply to this email and our team will help.</div>
          <p style="margin:28px 0 0;color:#746b83;font-size:14px;">Warmly,<br><strong style="color:#241c35;">The Giglify Team</strong></p>
          ${unsubscribe}
        </div>
        <div style="padding:18px 32px;background:#fbf7ff;border-top:1px solid #eee4f8;color:#746b83;font-size:12px;">Giglify · Microtasking, Done Right.</div>
      </div>
    </div>
  </body>
</html>`;
}

export function plainText(recipientName: string, message: string, unsubscribeUrl?: string): string {
  return `Hi ${recipientName || "there"},\n\n${message}\n\nWarmly,\nThe Giglify Team${unsubscribeUrl ? `\n\nUnsubscribe from marketing emails: ${unsubscribeUrl}` : ""}`;
}
