import win32com.client as win32
import os

try:
    excel = win32.gencache.EnsureDispatch('Excel.Application')
    # Use absolute paths
    in_path = r'D:\1. CHM본사\12. 인공지능\냉방장비 성능점검 Check list - T타워 20230724-0727.xls'
    out_path = r'C:\Users\user\.gemini\antigravity-ide\scratch\safety-training-app\public\template.xlsx'
    
    wb = excel.Workbooks.Open(in_path)
    wb.SaveAs(out_path, FileFormat=51) # 51 = xlsx
    wb.Close()
    excel.Application.Quit()
    print("Converted successfully to template.xlsx")
except Exception as e:
    print("Error:", e)
