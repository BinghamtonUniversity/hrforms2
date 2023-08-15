# Changelog

## Version 2.0.0 (DEV-20230815.????)
  * Fixed logic error in new user caching and completed error email notification. 
  * Moved workflow settings to new tab in the Admin Settings page.
  * Added popover to Admin Groups page to display description of the group.


## Version 2.0.0 (DEV-20230811.1557)
  * Added Admin Departments page. Individual departments allow the promary group to be set/changed.
  * Better indication of inactive users and groups in lists.  Inactive items are marked with a strikethrough and the label "(inactive)"
  * SUNY Account information is now populating forms; this was an outstanding item from the original work.  Testing and vaidation are still needed.
  * Major updates to users on the backside.  User information is now stored in the HR Forms tables.  This information is populated from SUNY HR initially.  Other APIs that need user information will use this stored data rather than calling SUNY HR if it exists.  If it doesn't exist then SUNY HR will be queried and the data will be stored.  If the data is "old" (a setting that can be changed in the Admin Settings area) it will attempt to refresh the data.  If there is no SUNY HR data an error email will be sent to me.  The error email is still a work in progress; more to come on that.
  * Changes in progress for archival of Requests and Forms to store the group and hierarchy information rather than pulling the "live" data.  Just like the person information this data should be a snapshot after it is archived as the workflow and groups could change.
  * Addition of CSV exports on several tables (users, groups and departments).  The export will export whatever data is currently available; so if you filter/search the export will match.  This CSV export capability will be expanded to other locations in the future (e.g. the Request and Form lists).
  * Beginning prep for move eventual into production; cleaning up console logging and finishing up "TODO"s in the files.
