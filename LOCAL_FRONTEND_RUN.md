# Running the Frontend Locally on Windows PC

This guide explains how to run the frontend of the Cheat Marketplace Platform locally on your Windows PC to preview and test the UI.

---

## Prerequisites

- Node.js (v16 or later) installed on your Windows PC. Download from https://nodejs.org/
- Git installed (optional, if you want to clone the repo)
- Access to the backend API (running locally or remote)

---

## Steps to Run Frontend Locally

1. **Clone the repository (if not already done):**

```bash
git clone <your-repo-url> cheat-marketplace
cd cheat-marketplace/frontend
```

2. **Install dependencies:**

Open a terminal (PowerShell or Command Prompt) in the `frontend` directory and run:

```bash
npm install
```

3. **Configure environment variables:**

Create a `.env.local` file in the `frontend` directory with the following content:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Adjust the URLs if your backend API is running on a different host or port.

4. **Run the frontend development server:**

```bash
npm run dev
```

This will start the Next.js development server on `http://localhost:3000`.

5. **Open your browser:**

Navigate to `http://localhost:3000` to see the frontend UI.

---

## Notes

- Make sure your backend API is running and accessible at the URL specified in `NEXT_PUBLIC_API_URL`.
- You can use the backend Docker container or run the backend locally as per the setup tutorial.
- The frontend will hot-reload on code changes, so you can edit files and see updates immediately.
- For production builds, use `npm run build` and `npm start`.

---

## Troubleshooting

- If you get CORS errors, ensure the backend allows requests from `http://localhost:3000`.
- Check the terminal for errors during startup or runtime.
- Verify environment variables are correctly set.

---

This guide should help you run and explore the frontend UI locally on your Windows PC.
