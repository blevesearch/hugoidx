package main

import (
	"strings"
	"time"

	"github.com/spf13/hugo/hugolib"
)

type Page struct {
	Title        string    `json:"title"`
	Type         string    `json:"type"`
	Section      string    `json:"section"`
	Content      string    `json:"content"`
	WordCount    float64   `json:"word_count"`
	ReadingTime  float64   `json:"reading_time"`
	Keywords     []string  `json:"keywords"`
	Date         time.Time `json:"date"`
	LastModified time.Time `json:"last_modified"`
	Author       string    `json:"author"`
}

func NewPageForIndex(page *hugolib.Page) *Page {
	var author string
	switch str := page.Params["author"].(type) {
	case string:
		author = str
	case []string:
		author = strings.Join(str, ", ")
	}
	return &Page{
		Title:        page.Title,
		Type:         page.Type(),
		Section:      page.Section(),
		Content:      page.Plain(),
		WordCount:    float64(page.WordCount),
		ReadingTime:  float64(page.ReadingTime),
		Keywords:     page.Keywords,
		Date:         page.Date,
		LastModified: page.Lastmod,
		Author:       author,
	}
}
