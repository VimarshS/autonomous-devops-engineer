export function generateFastapiDockerfile(config: {
  port?: number;
  pythonVersion?: string;
}): string {
  const port = config.port ?? 8000;
  const pythonVersion = config.pythonVersion ?? '3.11';

  return `FROM python:${pythonVersion}-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN addgroup --system --gid 1001 appgroup
RUN adduser --system --uid 1001 --gid 1001 appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE ${port}
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${port}"]
`;
}