live_stats Client TODO
----------------------

X Axis ticks when saved points changes
- multiple line graphs and axis
- Can't do anything without a websocket connection


- Different Chart Types
	O Line
		- Key for overlays
		- Tooltips on points
		O stacked vs overlaid
            - Transiton axis and labels
            - Show Key
        - Proper Axis
        - Use time labels on the axis?
        - Update every X seconds regardless, duplicate last points to keep the graph moving

	O Pie
		- Key

    O Bar
        - Handle text overlay on labels

    - All Charts
        - Proper handling of margins
        - Consistent CSS class names
        - Consistent code patterns for enter, update, exit
        - Headers and labels (show data source and group?)

        - Unregistering sources

- API
    - Tolarance of bad data
    - using untrusted strings in ID's - BAD BAD BAD - fix

- Tests
    - Test Multiple server sources
    - Sample HTML pages to test/explain API

- Auto Minify as a Git post-commit hook
