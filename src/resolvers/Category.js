const User = require('../models/User');

async function createdBy(parent, args, context) {
  return await User.findById(parent.createdBy);
}

module.exports =  {
  createdBy,
}
