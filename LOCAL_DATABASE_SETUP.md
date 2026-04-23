# Local Database Testing Setup

## 🚀 Quick Start Options

### Option 1: Mock Express Server (Recommended)

1. **Install dependencies:**
```bash
# Copy the mock server package.json
cp mock-server-package.json package-mock.json

# Install dependencies
npm install express cors nodemon --save-dev
```

2. **Start the mock server:**
```bash
node mock-server.js
```

3. **Test credentials:**
- Username: `NODE53530916`
- Password: `123456789`

### Option 2: JSON Server (Database-like)

1. **Install JSON Server:**
```bash
npm install -g json-server
```

2. **Start JSON Server:**
```bash
json-server --watch db.json --port 8080
```

3. **API Endpoints:**
- GET `/users` - List all users
- POST `/users` - Create new user
- GET `/users/1` - Get user by ID
- PUT `/users/1` - Update user
- DELETE `/users/1` - Delete user

### Option 3: Real Database Setup

#### PostgreSQL Setup:
```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or
sudo apt-get install postgresql postgresql-contrib  # Ubuntu

# Start PostgreSQL
brew services start postgresql  # macOS
# or
sudo systemctl start postgresql  # Ubuntu

# Create database
createdb stylocoin_db
```

#### MySQL Setup:
```bash
# Install MySQL
brew install mysql  # macOS
# or
sudo apt-get install mysql-server  # Ubuntu

# Start MySQL
brew services start mysql  # macOS
# or
sudo systemctl start mysql  # Ubuntu

# Create database
mysql -u root -p
CREATE DATABASE stylocoin_db;
```

## 🔧 Environment Configuration

Your `.env.local` is already configured for local testing:
```
VITE_API_BASE_URL=http://localhost:8080
```

## 🧪 Testing Your Frontend

1. **Start your React app:**
```bash
npm run dev
```

2. **Start your chosen backend:**
```bash
# Option 1: Mock server
node mock-server.js

# Option 2: JSON Server
json-server --watch db.json --port 8080
```

3. **Test the authentication:**
- Go to `http://localhost:5173/bandookwale/signin`
- Use test credentials: `NODE53530916` / `123456789`
- Or register a new user

## 📊 Database Schema Examples

### Users Table:
```sql
CREATE TABLE users (
  userPkId SERIAL PRIMARY KEY,
  versionId INTEGER,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  about TEXT,
  isUserIsAdmin BOOLEAN DEFAULT false,
  country VARCHAR(100),
  mobile VARCHAR(20),
  referralCode VARCHAR(50),
  position VARCHAR(10) CHECK (position IN ('Left', 'Right')),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Wallet Addresses Table:
```sql
CREATE TABLE wallet_addresses (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(userPkId),
  wallet VARCHAR(50),
  address VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);
```

## 🔍 API Testing with Postman/curl

### Login Test:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"NODE53530916","password":"123456789"}'
```

### Register Test:
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "password":"123456789",
    "mobile":"1234567890",
    "country":"USA",
    "referralCode":"",
    "position":"Left"
  }'
```

## 🐛 Debugging Tips

1. **Check browser console** for API errors
2. **Check network tab** in DevTools
3. **Verify CORS** settings if you get CORS errors
4. **Check port conflicts** - make sure 8080 is available
5. **Test API endpoints** directly with curl/Postman first

## 📝 Next Steps

1. Choose your preferred option (Mock server is fastest)
2. Start the backend server
3. Test login/registration
4. Add more API endpoints as needed
5. Consider setting up a real database for production
