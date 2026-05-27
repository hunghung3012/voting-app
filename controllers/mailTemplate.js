module.exports = function buildEmailTemplate(heading, content) {
    const today = new Intl.DateTimeFormat('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f4f8; margin: 0; padding: 40px 20px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #c0ddee; padding: 30px; }
        .badge { display: inline-block; background-color: rgba(255, 255, 255, 0.6); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; color: #556b82; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
        .heading { margin: 0; font-size: 24px; font-weight: bold; color: #2d4356; }
        .author-section { display: flex; align-items: center; padding: 24px 30px 0; }
        .avatar { width: 40px; height: 40px; background-color: #bbd7eb; border-radius: 50%; display: inline-block; text-align: center; line-height: 40px; color: #3b5266; font-weight: bold; font-size: 16px; margin-right: 12px; vertical-align: middle; }
        .author-text { display: inline-block; font-size: 14px; color: #64748b; vertical-align: middle; }
        .author-name { color: #334155; }
        .content { padding: 24px 30px 30px; font-size: 15px; line-height: 1.6; color: #475569; }
        .footer { background-color: #b8d4e9; padding: 16px 30px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #526b7d; }
        .footer-link { color: #ffffff; text-decoration: none; font-weight: 500; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <span class="badge">THÔNG BÁO</span>
            <h1 class="heading">${heading}</h1>
        </div>
        <div class="author-section">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td width="52">
                        <div class="avatar">B</div>
                    </td>
                    <td>
                        <div class="author-text"><span class="author-name">BlockVotes Admin</span> &middot; ${today}</div>
                    </td>
                </tr>
            </table>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td align="left" style="color: #526b7d; font-size: 13px;">Cập nhật lần cuối: hôm nay</td>
                    <td align="right">
                        <a href="http://localhost:3000" class="footer-link">Xem hệ thống &rarr;</a>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>`;
};
