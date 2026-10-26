package auth

import (
	"context"
	"os/exec"
	"strings"
	"testing"
	"time"
)

func TestNoXCryptoModuleInDependencyGraph(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "go", "list", "-mod=readonly", "-m", "-f", "{{.Path}}", "all")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("read dependency graph: %v: %s", err, out)
	}
	for _, path := range strings.Fields(string(out)) {
		if path == "golang.org/x/crypto" || strings.HasPrefix(path, "golang.org/x/crypto/") {
			t.Fatalf("x/crypto must be removed from the full module graph: %s", path)
		}
	}
}

func TestDeprecatedOpenPGPCannotBeImported(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "go", "list", "-mod=readonly", "golang.org/x/crypto/openpgp")
	out, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatal("deprecated OpenPGP must not be available from the selected dependencies")
	}
	if ctx.Err() != nil || !strings.Contains(string(out), "cannot find module providing package golang.org/x/crypto/openpgp") {
		t.Fatalf("expected missing OpenPGP package, got %v: %s", err, out)
	}
}
