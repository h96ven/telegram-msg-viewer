# Telegram Message Viewer

A simple Telegram client viewer with a FastAPI backend and Next.js frontend.

## Prerequisites

- Python 3.13
- Node.js & npm
- A Telegram API ID & Hash (from [my.telegram.org](https://my.telegram.org))

## Backend Setup

1. Clone the repository and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python3.13 -m venv venv
   source venv/bin/activate   # on Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with the following variables:
   ```dotenv
   DATABASE_URL=postgresql://user:pass@localhost/dbname
   SECRET_KEY=your-secret-key
   TELEGRAM_API_ID=123456
   TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
   ```
5. Run the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Frontend Setup

1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies (using the lockfile for exact versions):
   ```bash
   npm ci
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- Open your browser at `http://localhost:3000`.
- Connect your Telegram account, then browse chats and messages.

## Notes

- The backend listens on http://localhost:8000 by default.
- This project was developed and tested against PostgreSQL 15 on Windows.
- Adjust host/port or proxy settings as needed.



