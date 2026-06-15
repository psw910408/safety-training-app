import pandas as pd
import glob
import sys

files = glob.glob(r"D:\1. CHM본사\12. 인공지능\*.xls*")
for f in files:
    print(f"=== File: {f} ===")
    try:
        xls = pd.ExcelFile(f)
        for sheet in xls.sheet_names:
            print(f"  Sheet: {sheet}")
            df = pd.read_excel(f, sheet_name=sheet, nrows=20)
            print(df.head() if not df.empty else "    (empty)")
    except Exception as e:
        print(f"Error reading {f}: {e}")
