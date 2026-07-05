Set WshShell = CreateObject("WScript.Shell")
url = WScript.Arguments(0)
out_path = WScript.Arguments(1)
WshShell.Run "cmd.exe /c curl.exe -s """ & url & """ > """ & out_path & """", 0, True
