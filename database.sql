CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerkUserId VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  imageURL TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);