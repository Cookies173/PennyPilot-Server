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

CREATE TABLE transactions(
  id SERIAL PRIMARY KEY,
  type VARCHAR(50),
  userId INT,
  amount NUMERIC(15, 2),
  account_id INT,
  description VARCHAR(255),
  date TIMESTAMP,
  category VARCHAR(50),
  receiptUrl TEXT,
  isRecurring BOOLEAN,
  recurringInterval TEXT,
  nextRecurringDate TIMESTAMP,
  lastProcessed TIMESTAMP,
  status VARCHAR(255),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);