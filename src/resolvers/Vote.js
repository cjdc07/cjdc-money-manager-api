function account(parent, args, context) {
  return context.prisma.vote({ id: parent.id }).account()
}

function user(parent, args, context) {
  return context.prisma.vote({ id: parent.id }).user()
}

module.exports = {
  account,
  user,
}
