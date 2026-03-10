# ShareLine
# ShareLine

A full-stack web application for the Five College Consortium that connects students who want to donate items with students who need them. ShareLine provides a structured platform for listing, browsing, requesting, and coordinating the exchange of essential items such as textbooks, clothing, dorm supplies, and more.

---

## Features

- **User Authentication** — Register and log in with email and password. Users can hold the role of Donor, Requester, or both.
- **Item Listings with Photos** — Donors can post items with a title, category, description, condition, quantity, location, and optional photo uploads.
- **Item Browsing and Filtering** — Browse the public catalog and filter by category, campus location, or keyword search.
- **Request and Approval Workflow** — Requesters submit requests on items; donors approve or reject them from their dashboard.
- **In-App Messaging** — Once a request is approved, both parties can message each other through a private thread to coordinate pickup.
- **Real-Time Notifications** — Users receive instant notifications for new requests, approvals, rejections, and new messages.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React, Vite, Tailwind CSS           |
| Backend     | FastAPI, SQLModel                   |
| Database    | PostgreSQL                          |
| Auth        | JWT (via python-jose + passlib)     |
| File Storage| Object storage (S3 / Cloudflare R2) |
| Real-Time   | WebSockets (SSE fallback)           |

---

## Project Structure

```
shareline/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── backend/
│   ├── routers/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── db.py
│   └── requirements.txt
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL running locally or via a cloud provider

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```
DATABASE_URL=postgresql://user:password@localhost:5432/shareline
SECRET_KEY=your_secret_key_here
```

Run the development server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs are at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Overview

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| POST   | `/register`                     | Register a new user                |
| POST   | `/login`                        | Log in and receive a JWT           |
| GET    | `/me`                           | Get current user info              |
| GET    | `/items`                        | List all available items           |
| POST   | `/items`                        | Create a new item listing          |
| GET    | `/items/{id}`                   | Get a single item                  |
| POST   | `/requests`                     | Submit a request for an item       |
| PATCH  | `/requests/{id}`                | Approve or reject a request        |
| GET    | `/messages/{request_id}`        | Get messages for a request thread  |
| POST   | `/messages/{request_id}`        | Send a message in a thread         |
| GET    | `/notifications`                | Get notifications for current user |

---

## Environment Variables

| Variable       | Description                                      |
|----------------|--------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string                     |
| `SECRET_KEY`   | Secret key used to sign JWT tokens               |
| `STORAGE_URL`  | Object storage bucket URL for photo uploads      |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a pull request

---

## Team

Built by Krishna, Brunna, David, Arushee
