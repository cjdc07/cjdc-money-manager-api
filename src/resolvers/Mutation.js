const Account = require('../models/Account');
const User = require('../models/User');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const { APP_SECRET, getUserId } = require('../utils')

async function createAccount(parent, args, context) {
  const { name, balance, color } = args;
  const user = getUserId(context);

  const account = new Account({name, balance, color, createdBy: mongoose.Types.ObjectId(user)});

  await account.save();

  return account;
}

async function updateAccount(parent, args, context) {
  const { name, balance, color, id } = args;
  
  const account = await Account.findByIdAndUpdate(id, { name, name, balance, color }, {new : true} );

  return account;
}

async function signup(parent, args, context) {
  const { name, email } = args;
  const password = await bcrypt.hash(args.password, 10)

  const user = new User({name, email, password});

  await user.save();

  const token = jwt.sign({ userId: user.id }, APP_SECRET)

  return {
    token,
    user,
  }
}

async function login(parent, args, context) {
  const { email, password } = args;
  const user = await User.findOne({email});

  if (!user) {
    throw new Error('No such user found')
  }

  const valid = await bcrypt.compare(args.password, user.password)

  if (!valid) {
    throw new Error('Invalid password')
  }

  return {
    token: jwt.sign({ userId: user.id }, APP_SECRET),
    user,
  }
}

module.exports = {
  createAccount,
  updateAccount,
  signup,
  login,
}
