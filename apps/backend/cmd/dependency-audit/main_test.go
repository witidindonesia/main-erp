package main

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func TestSourceVerificationRejectsImplementationDrift(t *testing.T) {
	root := t.TempDir()
	upstream := t.TempDir()
	raw := []byte("package bcrypt\n\nimport _ \"golang.org/x/crypto/blowfish\"\n\nconst cost = 10\n")
	if err := os.WriteFile(filepath.Join(upstream, "bcrypt.go"), raw, 0600); err != nil {
		t.Fatal(err)
	}
	dir := filepath.Join(root, "third_party", "compat")
	if err := os.MkdirAll(dir, 0700); err != nil {
		t.Fatal(err)
	}
	local := filepath.Join(dir, "bcrypt.go")
	valid := []byte("package bcrypt\n\nimport _ \"mizu.local/compat/blowfish\"\n\nconst cost = 10\n")
	origins := []origin{{Dir: upstream, Files: []sourceFile{{Source: "bcrypt.go", Target: "compat/bcrypt.go", SHA256: fmt.Sprintf("%x", sha256.Sum256(raw))}}}}
	if err := os.WriteFile(local, valid, 0600); err != nil {
		t.Fatal(err)
	}
	if err := verifySources(root, origins); err != nil {
		t.Fatalf("import-only migration rejected: %v", err)
	}
	if err := os.WriteFile(local, []byte("package bcrypt\nconst cost = 4\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := verifySources(root, origins); err == nil {
		t.Fatal("algorithm change was accepted")
	}
	if err := os.WriteFile(local, valid, 0600); err != nil {
		t.Fatal(err)
	}
	extra := filepath.Join(dir, "unreviewed.go")
	if err := os.WriteFile(extra, []byte("package bcrypt\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := verifySources(root, origins); err == nil {
		t.Fatal("unrecorded source was accepted")
	}
	if err := os.Remove(extra); err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(local); err != nil {
		t.Fatal(err)
	}
	if err := verifySources(root, origins); err == nil {
		t.Fatal("missing source was accepted")
	}
}

func TestSourceVerificationAllowsGofmtWithoutChangingAlgorithm(t *testing.T) {
	root, upstream := t.TempDir(), t.TempDir()
	raw := []byte("package hash\nconst size=16\n")
	if err := os.WriteFile(filepath.Join(upstream, "hash.go"), raw, 0600); err != nil {
		t.Fatal(err)
	}
	dir := filepath.Join(root, "third_party", "compat")
	if err := os.MkdirAll(dir, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "hash.go"), []byte("package hash\n\nconst size = 16\n"), 0600); err != nil {
		t.Fatal(err)
	}
	origins := []origin{{Dir: upstream, Files: []sourceFile{{Source: "hash.go", Target: "compat/hash.go", SHA256: fmt.Sprintf("%x", sha256.Sum256(raw))}}}}
	if err := verifySources(root, origins); err != nil {
		t.Fatalf("format-only difference rejected: %v", err)
	}
}
