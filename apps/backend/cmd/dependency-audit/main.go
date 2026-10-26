// dependency-audit checks local source provenance, canonical upstream packages,
// and the migrated application's source, module graph and Linux artifacts.
package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"flag"
	"fmt"
	"go/format"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

const scannerVersion = "v1.9.0"

type sourceFile struct {
	Source string `json:"source"`
	Target string `json:"target"`
	SHA256 string `json:"sha256"`
}

type origin struct {
	Module   string       `json:"module"`
	Version  string       `json:"version"`
	Sum      string       `json:"sum"`
	GoModSum string       `json:"goModSum"`
	Files    []sourceFile `json:"files"`
	Dir      string       `json:"-"`
}

// Only import paths, canonical import comments and gofmt may differ from upstream.
var imports = strings.NewReplacer(
	`"golang.org/x/crypto/`, `"mizu.local/compat/`,
	`"golang.org/x/net/html`, `"mizu.local/compat/html`,
)

func verifySources(root string, origins []origin) error {
	expected := map[string]bool{}
	dirs := map[string]bool{}
	for _, o := range origins {
		for _, f := range o.Files {
			raw, err := os.ReadFile(filepath.Join(o.Dir, f.Source))
			if err != nil {
				return err
			}
			if fmt.Sprintf("%x", sha256.Sum256(raw)) != f.SHA256 {
				return fmt.Errorf("upstream checksum mismatch: %s/%s", o.Module, f.Source)
			}
			want := raw
			if strings.HasSuffix(f.Target, ".go") {
				want, err = format.Source([]byte(imports.Replace(string(raw))))
				if err != nil {
					return fmt.Errorf("format upstream %s: %w", f.Target, err)
				}
			}
			got, err := os.ReadFile(filepath.Join(root, "third_party", f.Target))
			if err != nil {
				return err
			}
			if !bytes.Equal(got, want) {
				return fmt.Errorf("local implementation drift: %s", f.Target)
			}
			expected[f.Target] = true
			dir, _, _ := strings.Cut(f.Target, "/")
			dirs[dir] = true
		}
	}
	for dir := range dirs {
		err := filepath.WalkDir(filepath.Join(root, "third_party", dir), func(path string, entry fs.DirEntry, err error) error {
			if err != nil || entry.IsDir() {
				return err
			}
			rel, err := filepath.Rel(filepath.Join(root, "third_party"), path)
			if err != nil {
				return err
			}
			rel = filepath.ToSlash(rel)
			for _, local := range []string{"go.mod", "go.sum", "UPSTREAM.md"} {
				if rel == dir+"/"+local {
					return nil
				}
			}
			if !expected[rel] {
				return fmt.Errorf("unrecorded local file: %s", rel)
			}
			return nil
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func run(dir string, env []string, name string, args ...string) error {
	fmt.Println("Running:", name, strings.Join(args, " "))
	cmd := exec.Command(name, args...)
	cmd.Dir, cmd.Env = dir, append(os.Environ(), env...)
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	return cmd.Run()
}

func audit(verifyOnly bool) error {
	root, err := os.Getwd()
	if err != nil {
		return err
	}
	raw, err := os.ReadFile(filepath.Join(root, "third_party", "provenance.json"))
	if err != nil {
		return err
	}
	var manifest struct {
		Origins []origin `json:"origins"`
	}
	if err := json.Unmarshal(raw, &manifest); err != nil {
		return err
	}
	temp, err := os.MkdirTemp("", "mizu-dependency-audit-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(temp)
	mod := "module mizu-audit-upstream\n\ngo 1.27.3\n\nrequire (\n"
	for _, o := range manifest.Origins {
		mod += o.Module + " " + o.Version + "\n"
	}
	mod += ")\n"
	if err := os.WriteFile(filepath.Join(temp, "go.mod"), []byte(mod), 0600); err != nil {
		return err
	}
	for i, o := range manifest.Origins {
		cmd := exec.Command("go", "mod", "download", "-json", o.Module+"@"+o.Version)
		cmd.Dir, cmd.Env = temp, append(os.Environ(), "GOWORK=off")
		out, err := cmd.Output()
		if err != nil {
			return fmt.Errorf("download origin %s: %w", o.Module, err)
		}
		var downloaded struct{ Dir, Sum, GoModSum string }
		if err := json.Unmarshal(out, &downloaded); err != nil {
			return err
		}
		if downloaded.Sum != o.Sum || downloaded.GoModSum != o.GoModSum {
			return fmt.Errorf("module checksum mismatch: %s", o.Module)
		}
		manifest.Origins[i].Dir = downloaded.Dir
	}
	if err := verifySources(root, manifest.Origins); err != nil {
		return err
	}
	fmt.Println("Pinned upstream checksums, licenses/assets and import-only source changes verified.")
	if err := run(root, nil, "go", "mod", "verify"); err != nil {
		return err
	}
	graph := exec.Command("go", "list", "-mod=readonly", "-m", "-f", "{{.Path}}", "all")
	graph.Dir = root
	modules, err := graph.CombinedOutput()
	if err != nil {
		return fmt.Errorf("read module graph: %w: %s", err, modules)
	}
	for _, path := range strings.Fields(string(modules)) {
		if path == "golang.org/x/crypto" || strings.HasPrefix(path, "golang.org/x/crypto/") {
			return fmt.Errorf("forbidden dependency in full graph: %s", path)
		}
	}
	fmt.Println("Full module graph contains no x/crypto dependency.")
	if verifyOnly {
		return nil
	}
	// These are upstream references, not application dependencies. Package-level
	// scanning retains advisory coverage for copied code under its canonical IDs.
	probe := `package main
import (
 _ "golang.org/x/crypto/bcrypt"
 _ "golang.org/x/crypto/blowfish"
 _ "golang.org/x/crypto/md4"
 _ "golang.org/x/crypto/ripemd160"
 _ "golang.org/x/crypto/ocsp"
 _ "golang.org/x/crypto/cryptobyte"
 _ "golang.org/x/crypto/cryptobyte/asn1"
 _ "golang.org/x/net/html/charset"
 _ "github.com/xuri/excelize/v2"
 _ "github.com/pdfcpu/pdfcpu/pkg/api"
 _ "github.com/pdfcpu/pdfcpu/pkg/pdfcpu/sign"
)
func main() {}
`
	if err := os.WriteFile(filepath.Join(temp, "main.go"), []byte(probe), 0600); err != nil {
		return err
	}
	if err := run(temp, []string{"GOWORK=off"}, "go", "mod", "tidy"); err != nil {
		return err
	}
	if err := run(root, []string{"GOBIN=" + temp}, "go", "install", "golang.org/x/vuln/cmd/govulncheck@"+scannerVersion); err != nil {
		return err
	}
	scanner := filepath.Join(temp, "govulncheck")
	if err := run(temp, []string{"GOWORK=off"}, scanner, "-db=https://vuln.go.dev", "-scan=package", "./..."); err != nil {
		return err
	}
	if err := run(root, nil, scanner, "-db=https://vuln.go.dev", "-test", "./..."); err != nil {
		return err
	}
	if err := run(filepath.Join(root, "cmd", "api"), nil, scanner, "-db=https://vuln.go.dev", "-scan=module"); err != nil {
		return err
	}
	linux := []string{"CGO_ENABLED=0", "GOOS=linux", "GOARCH=amd64"}
	if err := run(root, linux, scanner, "-db=https://vuln.go.dev", "-test", "./..."); err != nil {
		return err
	}
	for _, name := range []string{"api", "migrate"} {
		binary := filepath.Join(temp, name+"-linux")
		if err := run(root, linux, "go", "build", "-trimpath", "-ldflags=-s -w", "-o", binary, "./cmd/"+name); err != nil {
			return err
		}
		if err := run(root, nil, scanner, "-db=https://vuln.go.dev", "-mode=binary", binary); err != nil {
			return err
		}
	}
	return nil
}

func main() {
	verifyOnly := flag.Bool("verify-only", false, "verify pinned local source without vulnerability scans")
	flag.Parse()
	if err := audit(*verifyOnly); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
