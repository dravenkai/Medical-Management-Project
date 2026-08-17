# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
# --default-timeout/--retries: on a slow/unstable link, pip's default 15s
# read timeout kills an in-progress-but-slow package download (a
# "ReadTimeoutError", not a real connection failure) before it finishes —
# this makes it wait longer and retry instead of giving up.
RUN pip install --no-cache-dir --default-timeout=120 --retries=10 -r requirements.txt

COPY . .

# Long-running poller, not a web server — no EXPOSE needed.
CMD ["python", "bot.py"]
