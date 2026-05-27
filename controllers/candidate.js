const path = require('path');
const buildEmailTemplate = require('./mailTemplate');
var nodemailer = require('nodemailer');

module.exports = {
	register: function (req, res, cb) {
		var transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.EMAIL,
				pass: process.env.PASSWORD,
			},
		});
		const heading = `Đăng ký Ứng cử viên: ${req.body.election_name}`;
		const content = `
			<p>Chúc mừng bạn! Hồ sơ ứng cử viên của bạn cho cuộc bầu cử <strong>${req.body.election_name}</strong> đã được ghi nhận vào hệ thống thành công.</p>
			<div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
				<p style="margin: 0;"><strong>Tài khoản liên kết:</strong> ${req.body.email}</p>
			</div>
			<p>Bạn đã sẵn sàng để nhận phiếu bầu từ cử tri. Chúc bạn may mắn!</p>
		`;

		const mailOptions = {
			from: process.env.EMAIL,
			to: req.body.email,
			subject: req.body.election_name + ' Registration',
			html: buildEmailTemplate(heading, content),
		};
		transporter.sendMail(mailOptions, function (err, info) {
			if (err) {
				console.log(err);
				return res.json({ status: 'error', message: 'mail error', data: null });
			}
			console.log(info);
			res.json({ status: 'success', message: 'mail sent successfully!!!', data: null });
		});
	},
};
