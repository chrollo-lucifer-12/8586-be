# FreelancerPro Backend API

A comprehensive backend API for freelancer financial management built with Node.js, TypeScript, Express, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - User registration and login
  - Password hashing with bcrypt
  - Secure password change functionality

- **Project Management**
  - Create, read, update, delete projects
  - Project status tracking (active, completed, on-hold)
  - Budget allocation tracking
  - Client information management

- **Income Tracking**
  - Record income entries by project
  - Categorize income (project-payment, bonus, other)
  - Income analytics and statistics
  - Date-range filtering

- **Expense Management**
  - Track expenses by project and category
  - Receipt URL storage
  - Expense analytics and reporting
  - Category-based filtering

- **Financial Analytics**
  - Dashboard statistics
  - Monthly/yearly trends
  - Project-wise financial breakdown
  - Category-wise expense analysis

- **Security Features**
  - Rate limiting
  - CORS protection
  - Helmet security headers
  - Input validation and sanitization
  - Soft delete for data integrity

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Winston
- **Development**: Nodemon, ESLint

## 📁 Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   ├── index.ts          # Configuration management
│   │   └── database.ts       # Database connection
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── projectController.ts
│   │   ├── incomeController.ts
│   │   └── expenseController.ts
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── errorHandler.ts   # Global error handling
│   │   └── validation.ts     # Input validation
│   ├── models/
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── IncomeEntry.ts
│   │   └── ExpenseEntry.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── income.ts
│   │   └── expenses.ts
│   ├── utils/
│   │   ├── jwt.ts            # JWT utilities
│   │   ├── logger.ts         # Logging configuration
│   │   └── helpers.ts        # Utility functions
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── app.ts                # Express app configuration
│   └── server.ts             # Server entry point
├── logs/                     # Log files
├── .env                      # Environment variables
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=mongodb://localhost:27017/freelancer-pro
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. **Start MongoDB**
   Make sure your MongoDB instance is running.

5. **Run the application**
   
   **Development mode:**
   ```bash
   npm run dev
   ```
   
   **Production build:**
   ```bash
   npm run build
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "currency": "USD"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### Project Endpoints

#### Get All Projects
```http
GET /projects?page=1&limit=10&status=active
Authorization: Bearer <access_token>
```

#### Create Project
```http
POST /projects
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "E-commerce Website",
  "clientName": "ABC Company",
  "expectedPayment": 5000,
  "status": "active",
  "budgetAllocation": 15,
  "description": "Building a modern e-commerce platform"
}
```

#### Update Project
```http
PUT /projects/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "completed",
  "expectedPayment": 5500
}
```

### Income Endpoints

#### Get Income Entries
```http
GET /income?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <access_token>
```

#### Create Income Entry
```http
POST /income
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "projectId": "project_id_here",
  "amount": 2500,
  "description": "First milestone payment",
  "category": "project-payment",
  "date": "2024-07-19"
}
```

#### Get Income Statistics
```http
GET /income/stats?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <access_token>
```

### Expense Endpoints

#### Get Expense Entries
```http
GET /expenses?page=1&limit=10&category=software
Authorization: Bearer <access_token>
```

#### Create Expense Entry
```http
POST /expenses
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "projectId": "project_id_here",
  "amount": 99.99,
  "description": "Adobe Creative Suite subscription",
  "category": "software",
  "date": "2024-07-19"
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Comprehensive validation using express-validator
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Helmet**: Security headers for Express
- **Password Hashing**: bcrypt with configurable rounds
- **Soft Deletes**: Data integrity through soft deletion

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring & Logging

- **Winston**: Structured logging with multiple transports
- **Morgan**: HTTP request logging
- **Error Handling**: Centralized error handling with proper status codes
- **Health Check**: `/health` endpoint for monitoring

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=mongodb://your-production-db
JWT_SECRET=your-strong-production-secret
JWT_REFRESH_SECRET=your-strong-refresh-secret
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or run into issues, please:

1. Check the existing issues
2. Create a new issue with detailed information
3. Include error logs and environment details

## 📈 Future Enhancements

- [ ] Savings goals management
- [ ] Dashboard analytics endpoints
- [ ] File upload for receipts
- [ ] Email notifications
- [ ] Multi-currency support
- [ ] Export functionality (PDF/Excel)
- [ ] Advanced reporting
- [ ] Backup and restore features
- [ ] API rate limiting per user
- [ ] Webhook support for integrations

---

**Built with ❤️ for freelancers by freelancers**
