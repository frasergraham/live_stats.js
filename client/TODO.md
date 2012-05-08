live_stats Client TODO
----------------------

- Different Chart Types
	O Line
		- Key for overlays
		- Tooltips on points
		O stacked vs overlaid
        - Proper Axis
        - Display numerical value of most recent entry at end of stacked chart
        - Use clip paths to hide ugly transition artifacts
        - Use time labels on the axis?

	O Pie
		- Key

    O Bar
        - Handle text overlay on labels
    
    - All Charts
        - Proper handling of margins
        - Consistent CSS class names
        - Consistent code patterns for enter, update, exit
        - Headers and labels (show data source and group?)
    
        - Fix up how we do connections and register sources
        - Unregistering sources
        - fix default chart factory

- API
    O Refactor to use closures and method chaining
    - Charts as plugin modules?
    - chart creation as a function on the data source object
    - Tolarance of bad data

- Docs
    - Client README
    - Server README


- Tests
    - Test Multiple server sources


- Auto Minify as a Git hook?
