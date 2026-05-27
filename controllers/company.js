const CompanyModel = require('../models/company');
const ElectionMeta = require('../models/electionMeta');
const bcrypt = require('bcryptjs'); 
const path = require('path');
module.exports = {
    create: function(req, res, cb) {
        CompanyModel.findOne({email:req.body.email}, function(err, result) {
            if(err){
                cb(err);
            }
            else{
                if(!result){
                    CompanyModel.create({ email: req.body.email, password: req.body.password }, function (err, result) {
                        if (err) 
                            cb(err);
                        else{
                            CompanyModel.findOne({email:req.body.email}, function(err, CompanyInfo) {
                                if (err)
                                    cb(err);
                                else{
                                    res.json({status: "success", message: "Company added successfully!!!", data:{id:CompanyInfo._id}});
                                }
                            });  
                        }
                    });
                }
                else{
                    res.json({status: "error", message: "Company already exists ", data:null});
                }
            }
            
        });
    },
    authenticate: function(req, res, cb) {
        CompanyModel.findOne({email:req.body.email}, function(err, CompanyInfo){
            if (err) 
                cb(err);
            else {
                if(CompanyInfo && bcrypt.compareSync(req.body.password, CompanyInfo.password) && CompanyInfo.email == req.body.email) {
                    
                    res.json({status:"success", message: "company found!!!", data:{id: CompanyInfo._id, email: CompanyInfo.email}});
                }
                else {
                    res.json({status:"error", message: "Invalid email/password!!!", data:null});
                }
            }
        });
    },

    getMeta: async function(req, res) {
        try {
            const { address } = req.params;
            let meta = await ElectionMeta.findOne({ election_address: address });
            if (!meta) {
                // Return default state if not found
                return res.json({ status: 'success', is_ended: false, winner_name: '' });
            }
            res.json({ status: 'success', is_ended: meta.is_ended, winner_name: meta.winner_name, winner_votes: meta.winner_votes, ended_at: meta.ended_at });
        } catch (err) {
            res.json({ status: 'error', message: err.message });
        }
    },

    endElection: async function(req, res) {
        try {
            const { election_address, winner_name, winner_votes } = req.body;
            let meta = await ElectionMeta.findOne({ election_address });
            
            if (meta) {
                meta.is_ended = true;
                meta.winner_name = winner_name;
                meta.winner_votes = winner_votes;
                meta.ended_at = new Date();
                await meta.save();
            } else {
                await ElectionMeta.create({ 
                    election_address, 
                    is_ended: true, 
                    winner_name, 
                    winner_votes, 
                    ended_at: new Date() 
                });
            }
            res.json({ status: 'success', message: 'Election ended successfully' });
        } catch (err) {
            res.json({ status: 'error', message: err.message });
        }
    }
}