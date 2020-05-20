// function newAccountSubscribe(parent, args, context, info) {
//   return context.prisma.$subscribe.account({ mutation_in: ['CREATED'] }).node()
// }

// const newAccount = {
//   subscribe: newAccountSubscribe,
//   resolve: payload => {
//     return payload
//   },
// }

// function newVoteSubscribe(parent, args, context, info) {
//   return context.prisma.$subscribe.vote({ mutation_in: ['CREATED'] }).node()
// }

// const newVote = {
//   subscribe: newVoteSubscribe,
//   resolve: payload => {
//     return payload
//   },
// }

// module.exports = {
//   // newAccount,
//   // newVote,
// }
