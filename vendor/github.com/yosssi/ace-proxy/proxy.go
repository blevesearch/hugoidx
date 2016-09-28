package proxy

import (
	"html/template"

	"github.com/yosssi/ace"
)

// Proxy represents a proxy for the Ace template engine.
type Proxy struct {
	Opts *ace.Options
}

// Load calls the `Load` function of the Ace template engine.
func (p *Proxy) Load(basePath, innerPath string, opts *ace.Options) (*template.Template, error) {
	var o *ace.Options

	if opts == nil {
		o = p.Opts
	} else {
		o = opts
	}

	return ace.Load(basePath, innerPath, o)
}

// New creates and returns a proxy.
func New(opts *ace.Options) *Proxy {
	return &Proxy{
		Opts: opts,
	}
}
