FROM golang:1.22-alpine

WORKDIR /app

COPY scheduler.go .
COPY . .

RUN go mod tidy

EXPOSE 8080

CMD ["go", "run", "scheduler.go"]