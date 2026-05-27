const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/company');
router.post('/register', CompanyController.create);
router.post('/authenticate', CompanyController.authenticate);
router.get('/meta/:address', CompanyController.getMeta);
router.post('/end_election', CompanyController.endElection);
module.exports = router;