// The frame every Memories email shares: dark header, paper body, small footer.
// Inline styles and tables only: email apps ignore most modern CSS.

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const SANS = "'Instrument Sans', Helvetica, Arial, sans-serif";
const SERIF = "Newsreader, Georgia, 'Times New Roman', serif";

export function button(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#141414;color:#fafaf7;text-decoration:none;font-family:${SANS};font-weight:600;font-size:16px;padding:14px 26px;border-radius:8px">${escapeHtml(label)}</a>`;
}

export function paragraph(
  html: string,
  options: { muted?: boolean; small?: boolean } = {},
) {
  const size = options.small ? 14 : 16;
  const color = options.muted ? "#404040" : "#141414";
  return `<p style="margin:16px 0 0;font-family:${SANS};font-size:${size}px;line-height:1.6;color:${color}">${html}</p>`;
}

export function box(html: string) {
  return `<div style="margin:24px 0 0;background:#ffffff;border:1px solid #e4e2dc;border-radius:8px;padding:14px 16px;font-family:${SANS};font-size:14px;line-height:1.6;color:#404040">${html}</div>`;
}

export function layout(options: {
  title: string;
  preview: string;
  body: string;
  footer: string;
}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f2f1ec">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(options.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ec">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fafaf7;border:1px solid #e4e2dc;border-radius:12px;overflow:hidden">
<tr><td style="background:#141414;padding:28px 40px;font-family:${SERIF};font-size:30px;color:#fafaf7">Memories</td></tr>
<tr><td style="padding:36px 40px 32px">
<h1 style="margin:0;font-family:${SERIF};font-weight:400;font-size:32px;line-height:1.15;color:#141414">${escapeHtml(options.title)}</h1>
${options.body}
</td></tr>
<tr><td style="border-top:1px solid #e4e2dc;padding:18px 40px 24px;font-family:${SANS};font-size:12px;line-height:1.6;color:#525252">Every photo keeps the story behind it.<br>${options.footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
