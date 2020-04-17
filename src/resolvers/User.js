function accounts(parent, args, context) {
  return context.prisma.user({ id: parent.id }).accounts()
}

module.exports = {
  accounts,
}
