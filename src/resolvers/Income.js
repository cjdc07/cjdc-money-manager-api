const Account = require('../models/Account');
const Category = require('../models/Category');
const User = require('../models/User');

async function category(parent, args, context) {
  return await Category.findById(parent.category);
}

async function createdBy(parent, args, context) {
  return await User.findById(parent.createdBy);
}

async function account(parent, args, context) {
  return await Account.findById(parent.account);
}

module.exports =  {
  createdBy,
  account,
  category,
}
