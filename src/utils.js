const jwt = require('jsonwebtoken');

const Category = require('./models/Category');

const APP_SECRET = 'GraphQL-is-aw3some'

function getUserId(context) {
  const Authorization = context.req.get('Authorization');

  if (Authorization) {
    const token = Authorization.replace('Bearer ', '');
    const { userId } = jwt.verify(token, APP_SECRET);
    return userId;
  }

  throw new Error('Not authenticated');
}

async function findOrCreateCategory(category, user, transactionType) {
  let result = await Category.findOne({value: category});

  if (!result) {
    result = new Category({
      transactionType,
      value: category,
      createdBy: user,
    });
  
    await result.save();
  }

  return result;
}

module.exports = {
  APP_SECRET,
  findOrCreateCategory,
  getUserId,
}
