const https = require('https');
const { GoogleGenAI } = require('@google/genai');

module.exports = {
	analyzeCV: function (req, res) {
		try {
			const pdfBase64 = req.body.pdf_base64;
			if (!pdfBase64) {
				return res.json({ status: 'error', message: 'Không tìm thấy file PDF.' });
			}

			const apiKey = process.env.GEMINI_API_KEY_1;
			if (!apiKey) {
				return res.json({ status: 'error', message: 'Chưa cấu hình GEMINI_API_KEY_1 trong .env' });
			}

			const prompt = `
			Bạn là chuyên gia phân tích hồ sơ ứng viên. Hãy đọc CV/Resume và tóm tắt ngắn gọn bằng tiếng Việt.

QUAN TRỌNG: Không trích dẫn hay lưu lại thông tin cá nhân (họ tên, email, số điện thoại, địa chỉ). Chỉ phân tích năng lực và kinh nghiệm.

QUY TẮC TRÌNH BÀY:
- Dùng chữ hoa để đặt tiêu đề mỗi mục lớn
- Mỗi ý trên một dòng riêng, bắt đầu bằng dấu gạch ngang
- Không dùng markdown (không in đậm, không tiêu đề #)
- Không thêm lời mở đầu hay kết luận

CÁC MỤC BẮT BUỘC (theo đúng thứ tự):

MỤC TIÊU NGHỀ NGHIỆP
- [Tóm tắt ngắn gọn định hướng và kỳ vọng của ứng viên]

HỌC VẤN
- [Tên trường] — [chuyên ngành] — GPA [điểm nếu có]

KINH NGHIỆM & HOẠT ĐỘNG
- [Vai trò] tại [Tổ chức] ([thời gian ngắn gọn])
- [Đóng góp hoặc kết quả nổi bật nhất]

KỸ NĂNG
- Chuyên môn: [liệt kê ngắn]
- Kỹ năng mềm: [liệt kê ngắn]
- Ngoại ngữ: [nếu có]

THÀNH TÍCH & CHỨNG CHỈ
- [Liệt kê từng mục, bỏ qua nếu không có]

ĐIỂM MẠNH NỔI BẬT
- [Tối đa 3 điểm, dựa trên bằng chứng cụ thể từ hồ sơ]

GỢI Ý CẢI THIỆN
- [Tối đa 2 điểm thực tế và có thể thực hiện được]

Chỉ xuất ra đúng format trên, không thêm gì khác.
			
			`;

			const requestBody = JSON.stringify({
				contents: [{
					parts: [
						{ text: prompt },
						{
							inline_data: {
								mime_type: 'application/pdf',
								data: pdfBase64
							}
						}
					]
				}],
				generationConfig: {
					temperature: 0.3,
					maxOutputTokens: 4096,
				}
			});

			const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey.trim()}`;
			const parsedUrl = new URL(url);

			const options = {
				hostname: parsedUrl.hostname,
				path: parsedUrl.pathname + parsedUrl.search,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(requestBody),
				},
			};

			const apiReq = https.request(options, (apiRes) => {
				let data = '';
				apiRes.on('data', (chunk) => { data += chunk; });
				apiRes.on('end', () => {
					try {
						const json = JSON.parse(data);
						if (json.candidates && json.candidates[0] && json.candidates[0].content) {
							const text = json.candidates[0].content.parts[0].text;
							res.json({ status: 'success', summary: text });
						} else if (json.error) {
							console.log('Gemini API Error:', json.error);
							res.json({ status: 'error', message: 'Gemini lỗi: ' + (json.error.message || 'Unknown') });
						} else {
							console.log('Gemini unexpected response:', data.substring(0, 500));
							res.json({ status: 'error', message: 'Không nhận được phản hồi từ AI.' });
						}
					} catch (parseErr) {
						console.log('Parse error:', parseErr.message, data.substring(0, 300));
						res.json({ status: 'error', message: 'Lỗi xử lý phản hồi từ AI.' });
					}
				});
			});

			apiReq.on('error', (err) => {
				console.log('HTTPS request error:', err.message);
				res.json({ status: 'error', message: 'Không thể kết nối tới Gemini API.' });
			});

			apiReq.write(requestBody);
			apiReq.end();

		} catch (err) {
			console.log('analyzeCV error:', err.message);
			res.json({ status: 'error', message: 'Lỗi server: ' + err.message });
		}
	},

	chatVoter: async function (req, res) {
		try {
			const { message, context } = req.body;
			const apiKey = process.env.GEMINI_API_KEY_2;
			if (!apiKey) {
				return res.status(500).json({ status: 'error', message: 'Chưa cấu hình GEMINI_API_KEY_2' });
			}

			const prompt = `Bạn là AI trợ lý của hệ thống Bầu cử BlockVotes. Tên bạn là BlockVotes AI.
Nhiệm vụ của bạn là giải đáp các thắc mắc của cử tri về ứng cử viên, số phiếu, tình hình bầu cử.
Tuyệt đối CHỈ trả lời các câu hỏi liên quan đến hệ thống bầu cử, ứng viên, hoặc thông tin trong Context được cung cấp bên dưới. Nếu người dùng hỏi các vấn đề ngoài lề (như thời tiết, kiến thức chung, code, v.v.), hãy từ chối một cách lịch sự.

DỮ LIỆU BẦU CỬ HIỆN TẠI (CONTEXT):
${context}

CÂU HỎI CỦA CỬ TRI:
${message}

Hãy trả lời ngắn gọn, súc tích, thân thiện bằng tiếng Việt.`;

			// Set SSE headers
			res.setHeader('Content-Type', 'text/event-stream');
			res.setHeader('Cache-Control', 'no-cache');
			res.setHeader('Connection', 'keep-alive');
			res.setHeader('X-Accel-Buffering', 'no');
			res.flushHeaders();

			const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
			const responseStream = await ai.models.generateContentStream({
				model: 'gemini-3.5-flash',
				contents: prompt,
			});

			for await (const chunk of responseStream) {
				const text = chunk.text;
				if (text) {
					res.write(`data: ${JSON.stringify({ text })}\n\n`);
				}
			}

			res.end();
		} catch (err) {
			console.log('chatVoter error:', err.message);
			if (!res.headersSent) {
				res.status(500).json({ status: 'error', message: 'Lỗi server: ' + err.message });
			} else {
				res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
				res.end();
			}
		}
	}
};
