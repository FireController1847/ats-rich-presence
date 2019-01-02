#define MyAppName "ATS Rich Presence"
#define MyAppVersion "1.0.1"
#define MyAppPublisher "FireController#1847"
#define MyAppPublisherURL "https://github.com/FireController1847/ats-rich-presence"
#define MyAppExeName "ATSRichPresence.exe"
#define MyAppServiceName "VirtualTruckerRichPresence"

[Setup]
AppId={{EADCDA1D-5211-4C2F-A03C-EBACEA380143}
AppName={#MyAppName}                              
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppPublisherURL}
AppSupportURL={#MyAppPublisherURL} + "/issues"
AppUpdatesURL={#MyAppPublisherURL} + "/releases"
AppVerName={#MyAppName} {#MyAppVersion}
AppVersion={#MyAppVersion}
ArchitecturesInstallIn64BitMode=x64
DefaultDirName={pf}\{#MyAppName}
DisableProgramGroupPage=yes
DisableWelcomePage=no
OutputBaseFilename=ATSRichPresenceSetupx64
OutputDir=..\release
SetupIconFile=..\icon.ico
SolidCompression=yes
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}

[Tasks]
Name: "desktop_icon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startup"; Description: "Start {#MyAppName} when Windows starts (Recommended)"; GroupDescription: "Windows Startup:"
Name: "install_etcars"; Description: "Install ETCars during installation (Required)"; GroupDescription: "Other Tasks:" 

[Files]
Source: ".\ETCARSx64.exe"; DestDir: "{tmp}"; AfterInstall: InstallETCars
Source: "..\release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{commonprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktop_icon

[Registry]
Root: HKLM; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#MyAppName}"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{pf}\{#MyAppName}"

[UninstallRun]
Filename: "{cmd}"; Parameters: "/C ""taskkill /im {#MyAppExeName} /f /t"

[Code]
procedure InstallETCars;
var ResultCode: Integer;
begin
  if RegValueExists(HKLM64, 'SOFTWARE\SCS Software\American Truck Simulator\Plugins', 'ETCARS') then
    exit;
  if not
    Exec(ExpandConstant('{tmp}\ETCARSx64.exe'), '', '', SW_SHOWNORMAL, ewWaitUntilTerminated, ResultCode)
  then
    MsgBox('ETCars Failed to Install!' + #13#10 + SysErrorMessage(ResultCode), mbError, MB_OK);
end;