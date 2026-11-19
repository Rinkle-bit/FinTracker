# FinTracker - Personal Finance Management System

**FinTracker** is a full-stack personal finance management application built using the MERN stack. It helps users manage their financial activities by tracking income, expenses, budgets, savings goals, and transactions through an interactive dashboard.

The application provides visual financial analytics, transaction management, budget planning, and expense insights to help users understand their spending habits and make smarter financial decisions.

## Key Features

### 1. Dashboard
- Overview of total income and expenses.
- Display of current balance.
- Financial summary cards.
- Interactive charts and visual statistics.
- Recent transaction history.

### 2. Transaction Management
- Add income and expense transactions.
- Edit and delete transactions.
- Search and filter transactions.
- Categorize financial activities.
- Export transaction data to CSV.

### 3. Budget Management
- Create and manage monthly budgets.
- Track spending against budget limits.
- Monitor remaining budget.
- View category-wise expenses.

### 4. Savings Goals
- Create personal savings goals.
- Set target amounts.
- Track savings progress.
- Monitor progress toward financial targets.

### 5. Analytics and Reports
- Income and expense visualization.
- Spending pattern analysis.
- Category-wise financial breakdown.
- Monthly financial summaries.

### 6. Additional Features
- Calendar-based transaction view.
- User profile and settings.
- Login and registration interface.
- Responsive user interface.
- Recurring transaction interface.

## Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| JavaScript | Application logic |
| HTML5 | Page structure |
| CSS3 | Styling and responsive design |
| Node.js | Backend runtime |
| Express.js | REST API development |
| MongoDB | Database |
| Mongoose | Database modeling |
| JWT | Authentication |
| Recharts | Data visualization |

## Project Architecture

The project follows a frontend-backend architecture.

- **Frontend:** Handles user interaction, dashboard rendering, forms, and financial visualizations.
- **Backend:** Provides REST API endpoints and business logic.
- **Database:** MongoDB is intended to store user accounts and financial records.
- **Authentication:** JWT-based authentication is included in the backend architecture.

## Project Structure

```text
FinTracker/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── assets/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── server.js
│   │
│   └── package.json
│
└── README.md
```

## Installation and Setup

Follow these steps to run FinTracker locally.

### Prerequisites

Install the following tools:

- Node.js
- npm
- MongoDB
- Git
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/FinTracker.git
```

Navigate to the project directory:

```bash
cd FinTracker
```

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend directory.

Add the following environment variables:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fintracker
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Open the local development URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## Environment Variables

| Variable | Description |
|---|---|
| PORT | Backend server port |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret key for JWT authentication |
| CLIENT_URL | Frontend application URL |

**Important:** Never upload your `.env` file or expose your database credentials and secret keys on GitHub.

## Current Development Status

The following table distinguishes the existing frontend functionality from backend integration work.

| Feature | Status |
|---|---|
| Dashboard UI | Implemented |
| Income and Expense UI | Implemented |
| Transaction management interface | Implemented |
| Budget interface | Implemented |
| Savings goals interface | Implemented |
| Analytics dashboard UI | Implemented |
| Calendar and Reports UI | Implemented |
| Login and Registration UI | Implemented |
| Frontend local data storage | Implemented |
| Backend API foundation | Created |
| MongoDB connection | Requires verification |
| Frontend and backend authentication integration | Pending |
| Persistent transaction CRUD through MongoDB | Pending |
| Backend-powered analytics | Pending |
| Backend budget and savings integration | Pending |

Note: The current frontend uses browser localStorage for financial data. The backend API foundation is separate and the complete frontend-to-backend integration is still under development. Features marked pending should not be considered fully operational.

## Future Enhancements

The following features are planned for future development:

- AI-powered financial recommendations.
- Smart expense prediction.
- Automated monthly financial reports.
- Email notifications and budget alerts.
- Recurring transaction automation.
- PDF report generation.
- CSV transaction import.
- Improved financial analytics.
- Secure cloud-based data synchronization.

## Security Considerations

- Use environment variables for sensitive credentials.
- Implement password hashing using bcrypt.
- Protect private API routes with JWT authentication.
- Validate user inputs on the backend.
- Ensure users can access only their own financial records.

## Learning Outcomes

This project demonstrates practical knowledge of:

- Full-stack web application development.
- React component-based architecture.
- RESTful API development.
- Node.js and Express.js.
- MongoDB database management.
- User authentication concepts.
- Financial data visualization.
- Frontend and backend integration.

## Contributing

Contributions are welcome!

1. Fork this repository.
2. Create a new feature branch.
3. Make your changes.
4. Commit your changes.
5. Push your branch.
6. Submit a Pull Request.

## License

This project is developed for educational and academic purposes. You may modify and enhance it for learning and personal development.

---

**Developed as a Full Stack Development Project**

**Project Name:** FinTracker  
**Domain:** Personal Finance Management  
**Technology:** MERN Stack (MongoDB, Express.js, React.js, Node.js)

**Developed By:** Rinkle    
**Contact:** rinklesh.in@gmail.com    
**Linkedin:** linkedin.com/in/rinkle-sharma-in/   
