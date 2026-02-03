@echo off
echo Setting up AISteth RAG Agent...
cd /d "%~dp0"

echo Installing dependencies...
py -m pip install -r requirements_advanced.txt

echo.
echo NOTE: For the first run, you need to ingest the data.
echo Please open 'pinecone_rag_agent.py' and uncomment the following lines at the bottom:
echo     # agent.ingest_csv_data("Codes_by_class.csv")
echo     # agent.ingest_knowledge_base("usecases_billing.md")
echo.
pause

echo Running RAG Agent...
py pinecone_rag_agent.py

pause

