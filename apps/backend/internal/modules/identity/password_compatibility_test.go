package identity

import (
	"bytes"
	"encoding/json"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestLegacyBcryptPasswordCompatibility(t *testing.T) {
	const legacy = "$2b$10$WcqXOREe4/VUZZDAzgnX1OEFkluvFSKukf8/.IUqmCkW7dwO3Ng2e"
	for _, prefix := range []string{"$2a$", "$2b$", "$2y$"} {
		hash := prefix + legacy[4:]
		if !verifyPassword("rahasia-123", hash) || verifyPassword("salah", hash) {
			t.Fatalf("existing %s password compatibility changed", prefix)
		}
	}
	for _, hash := range []string{"", "not-a-hash", "$2b$10$short"} {
		if verifyPassword("rahasia-123", hash) {
			t.Fatalf("invalid hash accepted: %q", hash)
		}
	}
}

func TestGeneratedPasswordsRemainCompatibleWithBcryptJS(t *testing.T) {
	type passwordCase struct {
		Password string `json:"password"`
		Hash     string `json:"hash"`
	}
	var cases []passwordCase
	for _, password := range []string{"rahasia-123", strings.Repeat("x", 80), strings.Repeat("é", 40), strings.Repeat("a", 71) + "😀tail"} {
		hash, err := hashPassword(password)
		if err != nil || !strings.HasPrefix(hash, "$2b$10$") || !verifyPassword(password, hash) {
			t.Fatalf("password round trip failed: %v", err)
		}
		cases = append(cases, passwordCase{password, hash})
	}
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node unavailable for bcryptjs parity; Go round trips passed")
	}
	frontend, err := filepath.Abs("../../../../frontend/package.json")
	if err != nil {
		t.Fatal(err)
	}
	probe := exec.Command(node, "-e", "require('node:module').createRequire(process.argv[1]).resolve('bcryptjs')", frontend)
	if err := probe.Run(); err != nil {
		t.Skip("frontend bcryptjs is not installed; Go round trips passed")
	}
	input, err := json.Marshal(cases)
	if err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(node, "-e", `
const assert = require('node:assert/strict');
const bcrypt = require('node:module').createRequire(process.argv[1])('bcryptjs');
for (const {password, hash} of JSON.parse(require('node:fs').readFileSync(0, 'utf8'))) {
  assert(bcrypt.compareSync(password, hash), 'Go-written hash must verify in bcryptjs');
  assert(!bcrypt.compareSync('salah', hash), 'wrong password must fail');
}`, frontend)
	cmd.Stdin = bytes.NewReader(input)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("bcryptjs compatibility: %v: %s", err, out)
	}
}
