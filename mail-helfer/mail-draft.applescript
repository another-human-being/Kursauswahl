-- Legt eine Mail als Entwurf in Apple Mail an. Argumente: Empfänger, Betreff, Text, Absender (optional)
on run argv
	set theTo to item 1 of argv
	set theSubject to item 2 of argv
	set theBody to item 3 of argv
	set theSender to item 4 of argv
	tell application "Mail"
		set m to make new outgoing message with properties {subject:theSubject, content:theBody, visible:false}
		if theSender is not "" then set sender of m to theSender
		tell m to make new to recipient at end of to recipients with properties {address:theTo}
		save m
	end tell
end run
