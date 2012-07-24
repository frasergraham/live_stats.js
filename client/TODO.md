live_stats Client TODO
----------------------



- Different Chart Types
	O Line
		- Tooltips on points
        - Use time labels on the axis?
        - Axis should be time based? Requires async update?

    O Pie
        - Key
        - switch to storing historical and provide scrubber

    O Bar
        - Handle text overlay on labels
        - switch to storing historical and provide scrubber

    - All Charts
        - Update every X seconds regardless, duplicate last points to keep the graph moving
        - Proper handling of margins
        - Consistent CSS class names
        - Consistent code patterns for enter, update, exit
        - Headers and labels (show data source and group?)
        - Static data options
        - Unregistering sources

- API
    - Tolarance of bad data
    - using untrusted strings in ID's - BAD BAD BAD - fix

- Tests
    - Test Multiple server sources
    - Sample HTML pages to test/explain API

- Auto Minify as a Git post-commit hook
