const VoterModel = require('../models/voter');
const VoteRecord = require('../models/voteRecord');
const buildEmailTemplate = require('./mailTemplate');

const bcrypt = require('bcryptjs');

const path = require('path');

var nodemailer = require('nodemailer');

const saltRounds = 10;

module.exports = {
	create: function (req, res, cb) {
		VoterModel.findOne(
			{ email: req.body.email, election_address: req.body.election_address },
			function (err, result) {
				if (err) {
					cb(err);
				} else {
					if (!result) {
						VoterModel.create(
							{
								email: req.body.email,
								name: req.body.name || 'Không tên',
								password: req.body.email,
								election_address: req.body.election_address,
							},
							function (err, voter) {
								if (err) cb(err);
								else {
									console.log(voter);

									console.log(voter.email);

									console.log(req.body.election_description);

									console.log(req.body.election_name);

									var transporter = nodemailer.createTransport({
										service: 'gmail',

										auth: {
											user: process.env.EMAIL,

											pass: process.env.PASSWORD,
										},
									});

									const heading = `Đăng ký cử tri: ${req.body.election_name}`;
									const content = `
										<p>${req.body.election_description}</p>
										<div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
											<p style="margin: 0 0 8px;"><strong>Tài khoản (Voting ID):</strong> ${voter.email}</p>
											<p style="margin: 0;"><strong>Mật khẩu:</strong> ${voter.password}</p>
										</div>
										<p>Vui lòng đăng nhập hệ thống để bỏ phiếu. Chúc bạn một ngày tốt lành!</p>
									`;

									const mailOptions = {
										from: process.env.EMAIL, // sender address
										to: voter.email, // list of receivers
										subject: req.body.election_name, // Subject line
										html: buildEmailTemplate(heading, content),
									};

									transporter.sendMail(mailOptions, function (err, info) {
										if (err) {
											res.json({
												status: 'error',
												message: 'Voter could not be added',
												data: null,
											});

											console.log(err);
										} else {
											console.log(info);

											res.json({
												status: 'success',
												message: 'Voter added successfully!!!',
												data: null,
											});
										}
									});
								}
							}
						);
					} else {
						res.json({ status: 'error', message: 'Voter already exists ', data: null });
					}
				}
			}
		);
	},

	authenticate: function (req, res, cb) {
		VoterModel.findOne({ email: req.body.email, password: req.body.password }, function (err, voterInfo) {
			if (err) cb(err);
			else {
				if (voterInfo)
					res.json({
						status: 'success',
						message: 'voter found!!!',
						data: { id: voterInfo._id, election_address: voterInfo.election_address },
					});
				//res.sendFile(path.join(__dirname+'/index.html'));
				else {
					res.json({ status: 'error', message: 'Invalid email/password!!!', data: null });
				}
			}
		});
	},

	getAll: function (req, res, cb) {
		let voterList = [];

		VoterModel.find({ election_address: req.body.election_address }, function (err, voters) {
			if (err) cb(err);
			else {
				for (let voter of voters) voterList.push({ id: voter._id, email: voter.email, name: voter.name });

				count = voterList.length;

				res.json({
					status: 'success',
					message: 'voters list found!!!',
					data: { voters: voterList },
					count: count,
				});
			}
		});
	},

	updateById: function (req, res, cb) {
		VoterModel.findOne({ email: req.body.email }, function (err, result) {
			if (err) {
				cb(err);
			} else {
				console.log('email:' + req.body.email);
				console.log('findOne:' + result);
				if (!result) {
					password = bcrypt.hashSync(req.body.email, saltRounds);
					console.log('email not found');
					console.log('voterID:' + req.params.voterId);
					VoterModel.findByIdAndUpdate(
						req.params.voterId,
						{ email: req.body.email, password: password, name: req.body.name || 'Không tên' },
						function (err, voter) {
							if (err) cb(err);
							console.log('update method object:' + voter);
						}
					);
					VoterModel.findById(req.params.voterId, function (err, voterInfo) {
						if (err) cb(err);
						else {
							console.log('Inside find after update' + voterInfo);
							var transporter = nodemailer.createTransport({
								service: 'gmail',
								auth: {
									user: process.env.EMAIL,
									pass: process.env.PASSWORD,
								},
							});
							const heading = `Cập nhật thông tin cử tri: ${req.body.election_name}`;
							const content = `
								<p>${req.body.election_description}</p>
								<div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
									<p style="margin: 0 0 8px;"><strong>Tài khoản (Voting ID):</strong> ${voterInfo.email}</p>
									<p style="margin: 0;"><strong>Mật khẩu:</strong> ${voterInfo.password}</p>
								</div>
								<p>Tài khoản cử tri của bạn vừa được cập nhật. Bạn có thể sử dụng thông tin mới để đăng nhập.</p>
							`;

							const mailOptions = {
								from: process.env.EMAIL, // sender address
								to: voterInfo.email, // list of receivers
								subject: req.body.election_name, // Subject line
								html: buildEmailTemplate(heading, content),
							};
							transporter.sendMail(mailOptions, function (err, info) {
								if (err) {
									res.json({ status: 'error', message: 'Voter could not be added', data: null });
									console.log(err);
								} else {
									console.log(info);
									res.json({
										status: 'success',
										message: 'Voter updated successfully!!!',
										data: null,
									});
								}
							});
						}
					});
				} else {
					res.json({ status: 'error', message: 'Voter already exists ', data: null });
				}
			}
		});
	},

	deleteById: function (req, res, cb) {
		VoterModel.findByIdAndRemove(req.params.voterId, function (err, voterInfo) {
			if (err) cb(err);
			else {
				res.json({ status: 'success', message: 'voter deleted successfully!!!', data: null });
			}
		});
	},

	// Ghi lại lịch sử vote sau khi transaction blockchain thành công
	recordVote: async function (req, res) {
		try {
			const { voter_email, election_address, candidate_id, candidate_name } = req.body;
			if (!voter_email || !election_address) return res.json({ status: 'error', message: 'Thiếu thông tin' });

			const existing = await VoteRecord.findOne({ voter_email, election_address });
			if (existing) return res.json({ status: 'already_voted', message: 'Cử tri đã bỏ phiếu rồi' });

			// Lấy tên cử tri từ VoterModel
			const voterInfo = await VoterModel.findOne({ email: voter_email, election_address });
			const voter_name = voterInfo ? voterInfo.name : voter_email;

			await VoteRecord.create({ voter_email, voter_name, election_address, candidate_id: Number(candidate_id), candidate_name });
			res.json({ status: 'success', message: 'Đã ghi nhận phiếu bầu' });
		} catch (err) {
			console.log('recordVote error:', err.message);
			res.json({ status: 'error', message: err.message });
		}
	},

	checkVoted: async function (req, res) {
		try {
			const { voter_email, election_address } = req.body;
			const record = await VoteRecord.findOne({ voter_email, election_address });
			res.json({ status: 'success', has_voted: !!record, candidate_id: record ? record.candidate_id : -1 });
		} catch (err) {
			res.json({ status: 'error', has_voted: false });
		}
	},

	getVoteHistory: async function (req, res) {
		try {
			const { election_address } = req.body;
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const records = await VoteRecord.find({ election_address, voted_at: { $gte: sevenDaysAgo } }).sort({ voted_at: 1 });

			const countByDay = {};
			for (let i = 6; i >= 0; i--) {
				const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
				const key = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
				countByDay[key] = 0;
			}
			for (let r of records) {
				const key = new Date(r.voted_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
				if (key in countByDay) countByDay[key]++;
			}

			const allRecords = await VoteRecord.find({ election_address }).sort({ voted_at: -1 });
			res.json({
				status: 'success',
				labels: Object.keys(countByDay),
				values: Object.values(countByDay),
				history: allRecords.map(r => ({
					voter_email: r.voter_email,
					voter_name: r.voter_name || r.voter_email,
					candidate_name: r.candidate_name,
					dateStr: new Date(r.voted_at).toLocaleString('vi-VN')
				}))
			});
		} catch (err) {
			res.json({ status: 'error', message: err.message });
		}
	},

	resultMail: function (req, res, cb) {
		VoterModel.find({ election_address: req.body.election_address }, function (err, voters) {
			if (err) return cb(err);

			const election_name = req.body.election_name;
			const winner_candidate = req.body.winner_candidate;
			const candidate_email = req.body.candidate_email;

			var transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASSWORD,
				},
			});

			// Collect all mail promises
			let mailPromises = [];

			// Send result to all voters
			for (let voter of voters) {
				const heading = `Kết quả Bầu cử: ${election_name}`;
				const content = `
					<p>Cuộc bầu cử <strong>${election_name}</strong> đã kết thúc thành công tốt đẹp.</p>
					<div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #a7f3d0; text-align: center;">
						<p style="margin: 0; color: #065f46; font-size: 16px;">Người chiến thắng:</p>
						<h2 style="margin: 8px 0 0; color: #10b981; font-size: 24px;">${winner_candidate}</h2>
					</div>
					<p>Cảm ơn bạn đã tham gia bỏ phiếu!</p>
				`;

				const mailOptions = {
					from: process.env.EMAIL,
					to: voter.email,
					subject: election_name + ' results',
					html: buildEmailTemplate(heading, content),
				};
				mailPromises.push(new Promise((resolve, reject) => {
					transporter.sendMail(mailOptions, function (err, info) {
						if (err) { console.log('Mail error for ' + voter.email, err); resolve(false); }
						else { console.log('Mail sent to ' + voter.email, info); resolve(true); }
					});
				}));
			}

			// Send congratulations to the winner
			if (candidate_email) {
				const heading = `Chúc mừng bạn đã trúng cử!`;
				const content = `
					<p>Chúc mừng bạn! Bạn đã trở thành người chiến thắng trong cuộc bầu cử <strong>${election_name}</strong>.</p>
					<div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #bfdbfe; text-align: center;">
						<h2 style="margin: 0; color: #2563eb; font-size: 20px;">Kết quả xuất sắc</h2>
					</div>
					<p>Chúc bạn sẽ có một nhiệm kỳ thành công rực rỡ.</p>
				`;

				const winnerMail = {
					from: process.env.EMAIL,
					to: candidate_email,
					subject: election_name + ' results !!!',
					html: buildEmailTemplate(heading, content),
				};
				mailPromises.push(new Promise((resolve, reject) => {
					transporter.sendMail(winnerMail, function (err, info) {
						if (err) { console.log('Winner mail error', err); resolve(false); }
						else { console.log('Winner mail sent', info); resolve(true); }
					});
				}));
			}

			// Wait for all mails, then respond ONCE
			Promise.all(mailPromises).then(results => {
				const sent = results.filter(r => r).length;
				res.json({ status: 'success', message: `${sent} mails sent successfully!`, data: null });
			}).catch(e => {
				res.json({ status: 'error', message: 'Mail sending error', data: null });
			});
		});
	},
};
