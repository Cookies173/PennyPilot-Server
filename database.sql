CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerkUserId VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  imageURL TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE TABLE accounts(
	id SERIAL PRIMARY KEY,
	name VARCHAR(255),
	type VARCHAR(50),
	balance NUMERIC(15, 2),
	isDefault BOOLEAN,
	userId INT,
	createdAt TIMESTAMP,
	updatedAt TIMESTAMP
);