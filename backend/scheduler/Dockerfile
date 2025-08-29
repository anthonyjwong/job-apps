FROM golang:1.23.4-alpine

WORKDIR /app

COPY scheduler.go .
COPY . .

RUN go mod tidy

EXPOSE 8080

CMD ["go", "run", "scheduler.go"]