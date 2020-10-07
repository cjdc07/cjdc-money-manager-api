export const APP_SECRET = 'GraphQL-is-aw3some';

export enum TRANSACTION_TYPE {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum DEFAULT_DESCRIPTIONS {
  ACCOUNT_ADJUSMENTS = 'Account Adjustments',
  INITIAL_BALANCE = 'Initial Balance',
}

export const COLORS = {
  darkBlue: {
    alpha: 255,
    red: 0,
    green: 0,
    blue: 139,
  },
  darkRed: {
    alpha: 255,
    red: 139,
    green: 0,
    blue: 0,
  },
  dodgerBlue: {
    alpha: 255,
    red: 30,
    green: 144,
    blue: 255,
  },
  limeGreen: {
    alpha: 255,
    red: 50,
    green: 205,
    blue: 50,
  },
  grey: {
    alpha: 255,
    red: 128,
    green: 128,
    blue: 128,
  },
  darkOrange: {
    alpha: 255,
    red: 255,
    green: 140,
    blue: 0,
  },
};
