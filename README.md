# 🌱 PlantCare AI — Open-Source AI Plant Doctor

**Less Scrolling. More Growing.**

PlantCare AI is an AI-powered plant care application designed to help users understand plant health, analyze plant symptoms, manage their plants, and organize gardening activities. It combines a React frontend, a FastAPI backend, and locally running AI models through Ollama.

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/AI-Ollama-black)](https://ollama.com/)

## ✨ Features

- **AI Plant Doctor:** Upload a plant image and receive AI-generated observations and care recommendations.
- **Plant Management:** Organize and manage your plants.
- **Gardening Assistant:** Get help with plant care questions and gardening tasks.
- **Garden Planner:** Organize gardening activities and plans.
- **Plant Care Dashboard:** Access plant care information from a central dashboard.
- **Task Management:** Keep track of gardening activities.
- **Analytics:** Explore plant care and application information.
- **Local AI Inference:** Run supported AI models locally using Ollama.
- **REST API:** Use the FastAPI backend to connect the frontend with application services.
- **Automated Testing:** Includes TestSprite test plans and project test configuration.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| AI inference | Ollama |
| AI models | Configurable through environment variables |
| API documentation | FastAPI Swagger UI |
| Testing | Python tests and TestSprite plans |
| Version control | Git and GitHub |

## 🏗️ Project Structure

```text
Plantcare-ai/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── ...
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── package.json
│   └── .env.example
├── testsprite-plans/
├── plan.json
├── plantcare-tests.jsonl
├── .gitignore
└── README.md
```

## ⚙️ Prerequisites

Install the following before running the application:

- Python and pip
- Node.js and npm
- Git
- [Ollama](https://ollama.com/) with a model compatible with your project configuration

Check your installations:

```bash
python --version
node --version
npm --version
ollama --version
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yashbora18/Plantcare-ai.git
cd Plantcare-ai
```

### 2. Configure the backend

Create and activate a Python virtual environment from the project root.

**Windows PowerShell:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
cd backend
pip install -r requirements.txt
```

Create your local environment configuration using the example file:

```powershell
Copy-Item .env.example .env
```

Review `.env` and configure the values required by your setup. Use a unique, randomly generated secret key for local authentication and deployment. Never commit real credentials.

### 3. Configure Ollama

Install Ollama and pull the model configured in your backend environment.

For example, if your configuration uses `gemma3:4b`:

```powershell
ollama pull gemma3:4b
```

Start Ollama if it is not already running. Verify the model name and Ollama URL against your backend configuration.

### 4. Start the backend

From the `backend` directory, run:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8081
```

If your application entry point differs, use the corresponding module path from your backend configuration.

Open the API documentation:

- Swagger UI: http://127.0.0.1:8081/docs
- API root: http://127.0.0.1:8081/

### 5. Configure the frontend

Open a second terminal and navigate to the frontend directory:

```powershell
cd E:\Plantcare-ai\frontend
npm install
```

Create the frontend environment file:

```powershell
Copy-Item .env.example .env
```

Configure `VITE_API_URL` or the API variable expected by your frontend so that requests point to your running backend.

### 6. Start the frontend

```powershell
npm run dev
```

Open the local URL printed by Vite, usually:

http://localhost:5173

## 🧪 Testing

The repository includes backend test files and TestSprite test plans.

To run the backend tests, activate your virtual environment, navigate to the backend directory, and run:

```powershell
python -m pytest
```

If pytest is not installed, install the testing dependencies specified by your project.

To run the frontend production build:

```powershell
cd E:\Plantcare-ai\frontend
npm run build
```

Use the TestSprite platform and its CLI to execute the relevant browser tests. Test results depend on the current application state and local services.

## 🔐 Security Notes

- Never commit `.env` files containing real secrets.
- Use `.env.example` only for safe placeholders and non-sensitive defaults.
- Generate unique secret keys for each environment.
- Keep database files, credentials, and model weights out of version control.
- Do not expose development servers or local AI endpoints publicly without appropriate security controls.
- Rotate any credential that may have been exposed.

## 🗺️ Roadmap

Potential future improvements include:

- More plant species and disease recognition support
- Improved AI diagnosis reliability and confidence indicators
- Plant care reminders and personalized schedules
- Expanded gardening analytics
- Improved automated test coverage
- Production deployment and monitoring

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and test them.
4. Commit your changes with a descriptive message.
5. Open a pull request explaining the change.

## 📄 License

No license has been specified in this repository yet. Add a `LICENSE` file before explicitly granting others permission to reuse, modify, or distribute the project.

## 👨‍💻 Author

**Yash Bora**

- GitHub: [@yashbora18](https://github.com/yashbora18)
- Project repository: [PlantCare AI](https://github.com/yashbora18/Plantcare-ai)

---

*Built to make plant care more accessible with open-source AI.*
