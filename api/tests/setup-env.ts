process.env.NODE_ENV = "test"
process.env.PORT = "3333"
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://cantina:cantina_dev@localhost:5433/cantina_test"
process.env.JWT_SECRET = "test-secret-with-at-least-32-characters"
process.env.JWT_EXPIRES_IN = "1d"
