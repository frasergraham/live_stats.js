live_stats Client TODO
----------------------

- Bring Pie and Bar up to date with Line and new APIs
- Better sample pages
- Move editable() function into chart helper
- Ability to manually PULL new data?
- Chart pausing?
- Placement on page/grid
- Get rid of "name" and use a unique ID for all chart identifiers


- Different Chart Types
	O Line
		- Tooltips on points
        - Axis should be time based? Requires async update?
        - align the numbers and labels properly

    O Pie
        - Key/label options
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
    - Tolerance of bad data
    - using untrusted strings in ID's - BAD BAD BAD - fix
    - better static charts api?
        - e.g. two globals live_charts and static_charts? Or do we just consider static to be live that's
         not being updated right now? Can we transition between them?

- Tests
    - Test Multiple server sources
    - Sample HTML pages to test/explain API

- Auto Minify as a Git post-commit hook
