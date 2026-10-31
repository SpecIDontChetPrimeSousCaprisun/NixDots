<<<<<<< HEAD
hl.on("hyprland.start", function () 
    hl.exec_cmd("vesktop")
=======
-------------------
---- AUTOSTART ----
-------------------

-- See https://wiki.hypr.land/Configuring/Basics/Autostart/

-- Autostart necessary processes (like notifications daemons, status bars, etc.)
-- Or execute your favorite apps at launch like this:
--
hl.on("hyprland.start", function()
	hl.exec_cmd("vesktop")
	hl.exec_cmd("awww-daemon")
	hl.exec_cmd("qs")
	hl.exec_cmd("mpd")
>>>>>>> db97dce8000047021a91f60b1dd117d3fc385fc6
end)
