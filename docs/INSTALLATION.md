# Installation Guide

## 1. Extension Installation (Developer Mode)

To run the extension locally on your browser:

1. Open a Chromium-based browser (Chrome, Edge, Brave, etc.).
2. Navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer Mode** (usually a toggle in the top right corner).
4. Click on **Load unpacked**.
5. Select the `extension/` folder from this repository.
6. The "Free Blocker" extension will now appear in your browser toolbar.

## 2. Backend Setup (Local Development)

The backend provides user accounts, sync, and the referral system.

### Prerequisites
- Python 3.9+
- pip

### Steps

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

5. The API will be available at `http://localhost:8000`. You can view the interactive documentation at `http://localhost:8000/docs`.

### Extension Configuration
The extension is pre-configured to communicate with `http://localhost:8000` during development. If you deploy the backend elsewhere, update `API_CONFIG.BASE_URL` in `extension/utils/constants.js`.
