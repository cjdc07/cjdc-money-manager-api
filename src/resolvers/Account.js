const Account = require('../models/Account');

async function createdBy(parent, args, context) {
  return await Account.findById(parent.id).populate('createdBy');
}

module.exports =  {
  createdBy,
}