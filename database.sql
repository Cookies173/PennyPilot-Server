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
  accountId INT,
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

INSERT INTO transactions(
  type,
  userId,
  amount,
  accountId,
  description,
  date,
  category,
  receiptUrl,
  isRecurring,
  recurringInterval,
  nextRecurringDate,
  lastProcessed,
  status,
  createdAt,
  updatedAt
)
SELECT 
  CASE WHEN random() < 0.4 THEN 'income' ELSE 'expense' END,
  1, -- userId
  ROUND((random() * 10000 + 100)::NUMERIC, 2), -- amount between 100 and 10100
  17, -- account_id
  (ARRAY['Grocery shopping', 'Online subscription', 'Salary', 'Freelance work', 'Dining out', 'Utility bill'])[floor(random()*6)::int],
  NOW() - (interval '1 day' * floor(random() * 180)),
  (ARRAY['food', 'utilities', 'entertainment', 'salary', 'freelance', 'health'])[floor(random()*6)::int],
  CASE WHEN random() < 0.7 THEN 'https://example.com/receipt/' || md5(random()::text) ELSE NULL END,
  (random() < 0.3),
  CASE WHEN random() < 0.3 THEN (ARRAY['daily', 'weekly', 'monthly'])[floor(random()*3)::int] ELSE NULL END,
  NOW() + (interval '1 day' * floor(random() * 90)),
  NOW() - (interval '1 day' * floor(random() * 180)),
  (ARRAY['pending', 'completed', 'failed'])[floor(random()*3)::int],
  NOW() - (interval '1 day' * floor(random() * 180)),
  NOW()
FROM generate_series(1, 100);

CREATE TABLE budgets(
  id SERIAL PRIMARY KEY,
  amount NUMERIC(15, 2),
  userId INT,
  lastAlertSent TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);