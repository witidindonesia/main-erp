# Excel encryption compatibility fixture

`upstream-encrypted.xlsx` was produced outside the application using unmodified upstream Excelize v2.11.1-0.20261003002531-6258dcebc4e2 (Go1.27.3, canonical x/crypto and x/net dependencies, no local replacements). Password: `fixture-password` (test data only). Sheet1 contains A1=Nama, B1=Nilai, A2=Rani 😀, B2=42.

NewFile -> SetCellValue -> WriteToBuffer -> excelize.Encrypt(..., Options{Password: ...}). This independently generated ciphertext must remain readable after the compatibility-package migration; the wrong password must fail.

SHA256: 159f426f0a62d929dd57609fd14599d4e9756d09f62bf6a306e9145f06eafa2a
