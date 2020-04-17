const Account = require('../models/Account');

async function accountList(parent, args, context) {
  console.log(args); // TODO: use args

  const accounts = await Account.find({});
  const [ count ] = await Account.aggregate([{ '$match': {} }]).count('value');
  const [ total ] = await Account.aggregate([{ '$match': {} }]).group({
    '_id': null, // TODO: check if this relates to filter
    'value': {
      '$sum': '$balance'
    }
  });

  // const count = await context.prisma
  //   .accountsConnection({
  //     where: {
  //       OR: [
  //         { name_contains: args.filter },
  //       ],
  //     },
  //   })
  //   .aggregate()
  //   .count()
  // const accounts = await context.prisma.accounts({
  //   where: {
  //     OR: [
  //       { name_contains: args.filter },
  //     ],
  //   },
  //   skip: args.skip,
  //   first: args.first,
  //   orderBy: args.orderBy,
  // })
  
  return {
    accounts,
    count: count ? count.value : 0,
    total: total ? total.value : 0,
  }
}

module.exports = {
  accountList,
}
