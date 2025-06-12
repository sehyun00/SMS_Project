1. pip install - r requirements.txt 설치


2. app.py 22줄 절대경로 변경
-> NOTEBOOK_PATH = r"내가 설치한경로~~~\NLP_server\server\nlp_project.ipynb"

실행성공후

3. http://0.0.0.0:8000/analyze

body-> raw
예시 = {
    "portfolio_stocks": ["096770", "013890", "304780", "000810", "CONY", "AAPL", "TSLA", "SCHD", "NVDA"],
    "raw_weights": [15, 10, 8, 7, 5, 30, 20, 5, 10]
}


