@echo off
rem Wrapper so the preview/launch manager can run the dev server even when
rem Node isn't on its PATH. Prepends the Node install dir, then runs next dev.
set "PATH=C:\Program Files\nodejs;%PATH%"
set "NEXT_TELEMETRY_DISABLED=1"
call "C:\Program Files\nodejs\npm.cmd" run dev
