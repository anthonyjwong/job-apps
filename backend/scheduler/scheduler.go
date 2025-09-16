package main

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

func makePeriodicRequest(method string, endpoint string, interval time.Duration) {
	client := &http.Client{}
	baseURL := "http://backend:8000"

	for {

		req, err := http.NewRequest(method, baseURL+endpoint, nil)
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

func startAfterDelay(method string, endpoint string, delay time.Duration, interval time.Duration) {
	time.Sleep(delay)
	makePeriodicRequest(method, endpoint, interval)
}

func logScheduleStart(method string, endpoint string, delays []time.Duration, interval time.Duration) {
	startTimes := []string{}
	loc := time.Local
	for _, delay := range delays {
		t := time.Now().Add(delay).In(loc)
		startTimes = append(startTimes, t.Format("3:04 PM"))
	}
	fmt.Printf("Started schedule %s %s: Running at [%s] UTC, every %s\n", method, endpoint,
		strings.Join(startTimes, ", "), interval)
}

func main() {
	var wg sync.WaitGroup

	// Define schedules with initial delays and intervals.
	type periodicSchedule struct {
		method        string
		endpoint      string
		initialDelays []time.Duration // delays after startup, len(delays) = number of runs per interval
		interval      time.Duration   // repeat interval
	}

	const interval = 24 * time.Hour

	schedules := []periodicSchedule{
		{http.MethodPut, "/jobs/expire", []time.Duration{0 * time.Second, 15 * time.Minute, 30 * time.Minute, 45 * time.Minute, 60 * time.Minute}, interval},
		{http.MethodPut, "/jobs/review", []time.Duration{30 * time.Second, 20 * time.Minute, 40 * time.Minute, 60 * time.Minute, 80 * time.Minute}, interval},
		{http.MethodPost, "/apps/create", []time.Duration{45 * time.Second, 21 * time.Minute, 41 * time.Minute, 61 * time.Minute, 81 * time.Minute}, interval},
		{http.MethodPut, "/apps/prepare", []time.Duration{60 * time.Second, 22 * time.Minute, 42 * time.Minute, 62 * time.Minute, 82 * time.Minute}, interval},
		{http.MethodPut, "/apps/submit", []time.Duration{5 * time.Minute, 25 * time.Minute}, time.Hour},
		{http.MethodPost, "/jobs/find", []time.Duration{5 * time.Second}, interval},
	}

	// Start schedules
	for _, schedule := range schedules {
		for _, delay := range schedule.initialDelays {
			wg.Add(1)
			go startAfterDelay(schedule.method, schedule.endpoint, delay, schedule.interval)
		}
		logScheduleStart(schedule.method, schedule.endpoint, schedule.initialDelays, schedule.interval)
	}

	// wait forever
	wg.Wait()
}
