//go:build tools

package main

// Keep upstream gosu's dependencies visible to Go module update tools.
// The image compiles the checksum-verified upstream source, not this file.
import (
	_ "github.com/moby/sys/user"
	_ "golang.org/x/sys/unix"
)
