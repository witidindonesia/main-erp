module nuhabit/backend

go 1.27.3

require (
	github.com/go-pdf/fpdf v0.9.0
	github.com/jackc/pgx/v5 v5.11.0
	github.com/ledongthuc/pdf v0.0.0-20260907135840-6c8c28e0e8a0
	github.com/pdfcpu/pdfcpu v0.16.1
	github.com/xuri/excelize/v2 v2.11.1-0.20261003002531-6258dcebc4e2
	golang.org/x/image v0.46.0
	golang.org/x/text v0.43.0
	mizu.local/compat v0.0.0
	rsc.io/qr v0.2.0
)

require (
	github.com/clipperhouse/uax29/v2 v2.7.0 // indirect
	github.com/hhrutter/tiff v1.0.7 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/mattn/go-runewidth v0.0.30 // indirect
	github.com/richardlehane/mscfb v1.0.8 // indirect
	github.com/richardlehane/msoleps v1.0.6 // indirect
	github.com/tiendc/go-deepcopy v1.7.2 // indirect
	github.com/xuri/efp v0.0.2 // indirect
	github.com/xuri/nfp v0.0.2-0.20250530014748-2ddeb826f9a9 // indirect
	go.yaml.in/yaml/v3 v3.0.5 // indirect
	golang.org/x/sync v0.24.0 // indirect
	golang.org/x/sys v0.49.0 // indirect
)

replace mizu.local/compat => ./third_party/compat

replace github.com/xuri/excelize/v2 => ./third_party/excelize

replace github.com/pdfcpu/pdfcpu => ./third_party/pdfcpu
