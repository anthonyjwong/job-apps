package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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

	// Determine local timezone. If TZ is set (e.g., America/Los_Angeles), honor it; otherwise use system local.
	loc := time.Local
	if tz := os.Getenv("TZ"); tz != "" {
		if loaded, err := time.LoadLocation(tz); err == nil {
			loc = loaded
		} else {
			fmt.Printf("Warning: failed to load TZ '%s': %v. Falling back to system local.\n", tz, err)
		}
	}
	fmt.Printf("Scheduler using local time zone: %s\n", loc.String())

	// Define endpoints and their target local times of day (HH:MM, 24h). Adjust as needed.
	// Examples:
	// - Find new jobs every day at 09:00
	// - Review jobs twice a day at 09:10 and 21:00
	// - Create apps daily at 10:00
	// - Submit apps a few times a day
	schedules := []struct {
		path  string
		times []string // HH:MM in 24-hour format, local time
	}{
		{"/jobs/find", []string{"04:00"}},
		{"/jobs/review", []string{"09:00", "21:00"}},
		{"/apps/create", []string{"10:00"}},
		{"/apps/prepare", []string{"11:00"}},
		{"/apps/submit", []string{"09:30", "12:30", "15:30", "18:30", "21:30"}},
	}

	for _, s := range schedules {
		wg.Add(1)
		go scheduleAtTimes(s.path, s.times, loc, &wg)
		fmt.Printf("Started scheduler for %s at local times %v\n", s.path, s.times)
	}

	// wait forever
	wg.Wait()
}

// scheduleAtTimes triggers POST requests to endpoint at the specified local times (HH:MM, 24-hour).
func scheduleAtTimes(endpoint string, timesOfDay []string, loc *time.Location, wg *sync.WaitGroup) {
	defer wg.Done()

	if len(timesOfDay) == 0 {
		fmt.Printf("No times configured for %s; scheduler will not run.\n", endpoint)
		return
	}

	client := &http.Client{}
	baseURL := "http://backend:8000"

	for {
		now := time.Now().In(loc)
		nextTime, label, err := nextOccurrence(now, timesOfDay, loc)
		if err != nil {
			fmt.Printf("Error computing next time for %s: %v. Retrying in 1 minute.\n", endpoint, err)
			time.Sleep(time.Minute)
			continue
		}
		dur := time.Until(nextTime)
		if dur < 0 {
			dur = 0
		}
		fmt.Printf("%s scheduled at %s local (in %s)\n", endpoint, nextTime.Format(time.RFC3339), dur.Round(time.Second))
		timer := time.NewTimer(dur)
		<-timer.C

		// Fire the request
		req, err := http.NewRequest("POST", baseURL+endpoint, nil)
		if err != nil {
			fmt.Printf("Error creating request for %s at %s: %v\n", endpoint, label, err)
			continue
		}
		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error making request to %s at %s: %v\n", endpoint, label, err)
			continue
		}
		fmt.Printf("Request to %s at %s completed with status: %s\n", endpoint, label, resp.Status)
		resp.Body.Close()
	}
}

// nextOccurrence returns the next time (>= now) when any of the timesOfDay will occur in the given location,
// along with a human label of the chosen HH:MM. timesOfDay are strings like "09:00", "21:30".
func nextOccurrence(now time.Time, timesOfDay []string, loc *time.Location) (time.Time, string, error) {
	const layout = "15:04"
	var (
		best      time.Time
		bestLabel string
		set       bool
	)
	for _, tstr := range timesOfDay {
		tt, err := time.ParseInLocation(layout, tstr, loc)
		if err != nil {
			return time.Time{}, "", fmt.Errorf("invalid time '%s': %w", tstr, err)
		}
		candidate := time.Date(now.Year(), now.Month(), now.Day(), tt.Hour(), tt.Minute(), 0, 0, loc)
		if !candidate.After(now) {
			candidate = candidate.Add(24 * time.Hour)
		}
		if !set || candidate.Before(best) {
			best = candidate
			bestLabel = tstr
			set = true
		}
	}
	if !set {
		return time.Time{}, "", fmt.Errorf("no valid times provided")
	}
	return best, bestLabel, nil
}
