package main

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

func makePeriodicRequest(endpoint string, interval time.Duration) {
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

func startAfterDelay(endpoint string, delay time.Duration, interval time.Duration) {
	time.Sleep(delay)
	makePeriodicRequest(endpoint, interval)
}

func logScheduleStart(endpoint string, delays []time.Duration, interval time.Duration) {
	startTimes := []string{}
	loc := time.Local
	for _, delay := range delays {
		t := time.Now().Add(delay).In(loc)
		startTimes = append(startTimes, t.Format("3:04 PM"))
	}
	fmt.Printf("Started schedule for %s: Running at [%s] UTC, every %s\n", endpoint,
		strings.Join(startTimes, ", "), interval)
}

func main() {
	var wg sync.WaitGroup

	// Define schedules with initial delays and intervals.
	type periodicSchedule struct {
		endpoint      string
		initialDelays []time.Duration // delays after startup, len(delays) = number of runs per interval
		interval      time.Duration   // repeat interval
	}

	const interval = 24 * time.Hour

	schedules := []periodicSchedule{
		{"/jobs/review", []time.Duration{0 * time.Second, 4 * time.Hour, 16 * time.Hour}, interval},
		{"/apps/create", []time.Duration{5 * time.Second, 8 * time.Hour, 20 * time.Hour}, interval},
		{"/apps/prepare", []time.Duration{10 * time.Second, 12 * time.Hour, 24 * time.Hour}, interval},
		{"/apps/submit", []time.Duration{5 * time.Minute}, time.Hour},
		{"/jobs/find", []time.Duration{30 * time.Second}, interval},
	}

	// Start schedules
	for _, schedule := range schedules {
		for _, delay := range schedule.initialDelays {
			wg.Add(1)
			go startAfterDelay(schedule.endpoint, delay, schedule.interval)
		}
		logScheduleStart(schedule.endpoint, schedule.initialDelays, schedule.interval)
	}

	// wait forever
	wg.Wait()
}
