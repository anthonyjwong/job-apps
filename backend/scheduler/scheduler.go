package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"nhooyr.io/websocket"
)

type ReviewMessage struct {
	Type string `json:"type"`
	Data struct {
		Completed  int     `json:"completed,omitempty"`
		Total      int     `json:"total,omitempty"`
		Percentage float64 `json:"percentage,omitempty"`
		Message    string  `json:"message,omitempty"`
	} `json:"data"`
}

func waitForReviewCompletion(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Minute)
	defer cancel()

	wsURL := "ws://backend:8000/ws/jobs/review"
	c, _, err := websocket.Dial(ctx, wsURL, nil)
	if err != nil {
		return fmt.Errorf("failed to connect to WebSocket: %v", err)
	}
	defer c.Close(websocket.StatusNormalClosure, "")

	for {
		_, message, err := c.Read(ctx)
		if err != nil {
			return fmt.Errorf("failed to read message: %v", err)
		}

		var msg ReviewMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			return fmt.Errorf("failed to parse message: %v", err)
		}

		switch msg.Type {
		case "progress":
			fmt.Printf("Review progress: %.2f%% (%d/%d)\n",
				msg.Data.Percentage, msg.Data.Completed, msg.Data.Total)
		case "complete":
			fmt.Printf("Review complete: %s\n", msg.Data.Message)
			return nil
		case "error":
			return fmt.Errorf("review failed: %s", msg.Data.Message)
		}
	}
}

func makePeriodicRequest(endpoint string, interval time.Duration, wg *sync.WaitGroup) {
	defer wg.Done()

	client := &http.Client{}
	baseURL := "http://backend:8000"

	for {

		// Normal handling for other endpoints
		req, err := http.NewRequest("POST", baseURL+endpoint, nil)
		if err != nil {
			fmt.Printf("Error creating request for %s: %v\n", endpoint, err)
			time.Sleep(interval)
			continue
		}

		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error making request to %s: %v\n", endpoint, err)
			time.Sleep(interval)
			continue
		}

		fmt.Printf("Request to %s completed with status: %s\n", endpoint, resp.Status)
		resp.Body.Close()

		time.Sleep(interval)
	}
}

func main() {
	var wg sync.WaitGroup

	// define endpoints and their intervals
	endpoints := []struct {
		path     string
		interval time.Duration
	}{
		{"/jobs/find", time.Hour * 24}, // daily
		{"/apps/submit", time.Hour},    // every 1 hour
		// {"/jobs/review", time.Hour * 24}, // daily
		// {"/apps/create", time.Hour * 24}, // daily
		// {"/apps/prepare", time.Hour * 24}, // daily
	}

	// start a goroutine for each endpoint
	for _, e := range endpoints {
		wg.Add(1)
		go makePeriodicRequest(e.path, e.interval, &wg)
		fmt.Printf("Started scheduler for %s with interval %v\n", e.path, e.interval)
	}

	// wait forever
	wg.Wait()
}
