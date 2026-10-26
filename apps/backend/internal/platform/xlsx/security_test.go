package xlsx

import (
	"bytes"
	"context"
	"errors"
	"os"
	"os/exec"
	"testing"
	"time"

	"github.com/xuri/excelize/v2"
)

func TestReadWorkbookEncryptedByOriginalUpstream(t *testing.T) {
	data, err := os.ReadFile("testdata/upstream-encrypted.xlsx")
	if err != nil {
		t.Fatal(err)
	}
	f, err := excelize.OpenReader(bytes.NewReader(data), excelize.Options{Password: "fixture-password"})
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	for cell, want := range map[string]string{"A1": "Nama", "B1": "Nilai", "A2": "Rani 😀", "B2": "42"} {
		got, err := f.GetCellValue("Sheet1", cell)
		if err != nil || got != want {
			t.Fatalf("upstream encrypted cell %s = %q, %v; want %q", cell, got, err, want)
		}
	}
	if bad, err := excelize.OpenReader(bytes.NewReader(data), excelize.Options{Password: "wrong"}); err == nil {
		bad.Close()
		t.Fatal("incorrect workbook password was accepted")
	}
}

// A tiny workbook must not make an upload loop over billions of empty rows
// before the application's MaxRows limit can be applied (GO-2026-6685).
func TestRejectOversizedSpreadsheetRow(t *testing.T) {
	if mode := os.Getenv("MIZU_XLSX_ROW_PROBE"); mode != "" {
		f := excelize.NewFile()
		defer f.Close()
		f.Sheet.Delete("xl/worksheets/sheet1.xml")
		f.Pkg.Store("xl/worksheets/sheet1.xml", []byte(`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c><v>1</v></c></row><row r="2147483647"><c><v>2</v></c></row></sheetData></worksheet>`))
		data, err := f.WriteToBuffer()
		if err != nil {
			t.Fatal(err)
		}
		if mode == "matrix" {
			_, err = ParseMatrix(data.Bytes(), ReadOptions{Limits: Limits{MaxRows: 2}})
		} else {
			_, err = ParseCSVParts(data.Bytes(), Limits{MaxRows: 2})
		}
		if !errors.Is(err, excelize.ErrMaxRows) {
			t.Fatalf("malformed row must be rejected, got %v", err)
		}
		return
	}
	bin, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	for _, mode := range []string{"matrix", "csv"} {
		t.Run(mode, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			cmd := exec.CommandContext(ctx, bin, "-test.run=^TestRejectOversizedSpreadsheetRow$")
			cmd.Env = append(os.Environ(), "MIZU_XLSX_ROW_PROBE="+mode)
			if out, err := cmd.CombinedOutput(); err != nil {
				t.Fatalf("spreadsheet parser must reject oversized rows promptly: %v (%v)\n%s", err, ctx.Err(), out)
			}
		})
	}
}
