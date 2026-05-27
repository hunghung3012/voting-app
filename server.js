process.on('uncaughtException', err => { console.error('UNCAUGHT EXCEPTION:', err); });
process.on('unhandledRejection', err => { console.error('UNHANDLED REJECTION:', err); });
const next = require('next');
const express = require('express');
const voter = require('./routes/voter');
const company = require('./routes/company');
const candidate = require('./routes/candidate');
const ai = require('./routes/ai');
const bodyParser = require('body-parser');
const mongoose = require('./config/database');
const exp = express();
const path = require('path');

require('dotenv').config({ path: __dirname + '/.env' });

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

exp.use(
	bodyParser.urlencoded({
		extended: true,
		limit: '50mb',
	})
);
exp.use(bodyParser.json({ limit: '50mb' }));
exp.get('/', function (req, res) {
	res.redirect('/homepage');
});

exp.use('/company', company);

exp.use('/voter', voter);

exp.use('/candidate', candidate);

exp.use('/ai', ai);

const app = next({
	dev: process.env.NODE_ENV !== 'production',
});

const routes = require('./routes');
const handler = routes.getRequestHandler(app);

app.prepare().then(() => {
	exp.use(handler).listen(3000, function () {
		console.log('Node server listening on port 3000');

		// Pre-warm all key pages so first user click is instant
		const http = require('http');
		const pages = [
			'/homepage',
			'/company_login',
			'/voter_login',
			'/election/create_election',
			// Dynamic pages — dummy address triggers compilation even if 404
			'/election/0x0000000000000000000000000000000000000001/company_dashboard',
			'/election/0x0000000000000000000000000000000000000001/candidate_list',
			'/election/0x0000000000000000000000000000000000000001/voting_list',
		];
		setTimeout(() => {
			pages.forEach(page => {
				http.get(`http://localhost:3000${page}`, res => {
					console.log(`Pre-warmed: ${page} (${res.statusCode})`);
				}).on('error', () => {});
			});
		}, 3000); // wait 3s for server to fully settle
	});
}).catch((err) => {
    console.error("Next.js prepare error:", err);
    process.exit(1);
});
