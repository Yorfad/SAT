export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  bcrypt: {
    saltRounds: 10,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default-key',
    iv: process.env.ENCRYPTION_IV || 'default-iv',
  },
};