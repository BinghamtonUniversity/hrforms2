# Changelog

## Version 2.0.0(DEV-20240501)
  * Fix field focus on forms; check to make sure field exists before focusing.
  * Fixes for range sliders and linked input on Form Position and Appointment tabs.
  * Added "markers" for range sliders.
  * Set Form Salary Effective Date to default to the Appointment Effective Date.
  * Added checkbox for "PR Required" to Form Payroll Transactions setup.
  * Added checkbox on Form to prompt user if they have submitted a PR.  Alert is displayed based on the Payroll Transaction setup.
  * Restructured Request and Form Hierarchy tables and code to use an intermediate table linking hierarchy and group tables.  Fixes bug where an empty list item is left when a group is deleted.


## Version 2.0.0(DEV-20240424)
  * Removed Form/Request query from Journal.  The only data used was the lastJournal data which can be derived from the journal query already used.
  * Initialize person lookup results as empty array to fix error when searching for new employee.
  * Set userGroups to empty array when USER_GROUPS is null in form.js; fix split error.
  * Moved preload icons to app configuration.
  * Fixed "no changes" error when only modifying a user's groups; changes to groups should update records.
  * Update cached user information when user's groups are changed.
  * Fixed No Data Found error when clearing Line Number Search on Position tab in forms.
  * Fixed Appointment percentage not carrying over to Salary tab.
  * Fixed Appointment percentage on Position tab not being limited when less than 100%.
  * Fixed spelling error in Person Directory tab.
  * Carry Birthdate from lookup into Demographics tab.
  * Make Group Name column in Groups table wider - added grow option.
  * Multiple fixes to the Directory tab in Forms.
  * Added "paged" query support for Forms Hiearchy table in Admin.


## Version 2.0.0(DEV-20240401)
  * Fixed bug with conditions on hiearchies not deleting when the delete button is clicked.
  * Fixed bug in user.php that was preventing cached user information from updating and returning empty data.
  * Fixed bug with Line Number search on Employment->Position tab in Forms that caused form to submit when enter key presses.
  * Changed key press handling for Line Number search on Employment->Position to clear existing search results.  Previously an error alert would show on every key press indicating the partial line number was not found.
  * Added "Group" to Forms Hiearchy workflow selector when "Route To Group" is selected.
  * Hide the news alert if there is no news text.
  * Switched to using OCI_RETURN_LOBS for data fetch instead of using load function for most API calls.
  * Added _HISTORY tables to save Groups, Hierarchies, and Workflows when changed; used for Archived Requests/Forms.
  * Removed PATCH method from workflow.php; not in use.
  * Updates to Workflow Expander Component.  Use full group and status array instead of dropping first record (i.e. submitter).
  * Updates to Journal Expander Component: hide Group From/To for Submitted sequence (not relevant).
  * Updates to Journal Expander Component: no link when Group From is the Submitter group (-99).
  * Updates to Journal Expander Component: no link to Groups when the Request/Form is archived.
  * New "plum" color for Archived badge box.
  * Added Archived to menu items for Requests and Forms.


## Version 2.0.0(DEV-20240229)
  * Fixed error in bind variable for description for the POST and PUT operations in code.php.
  * Fixed formatting on Payroll Codes - Additional Info tab.  Long help text was causing layout issues.
  * Fixed Form Workflows to consider "Send to Group" and "Conditions" when checking for duplicates.
  * Added "Route By" option to Payroll Transactions.
  * Added code to use "Route By" option on form submit and route form accordingly.
  * Updated search on Payroll Transactions to "tokenize" search terms.  Allows for searching of individual components.
  * Changed color of Copy/Duplicate buttton to secondary color.
  * Fixed "undefined" on class of AppButton component.
  * Added configuration to hide or disable Delete button on Payroll Transactions tabs.
  

## Version 2.0.0 (DEV-20231222)
  * Updates to Page Titles
  * Added new text values to config for tab titles.
  * Removed Logout from Navigation Menu (not needed - may rework later).
  * Verified preferred name was used in all areas where name was needed.
  * Hide "actions" column in tables for printing.


## Version 2.0.0 (DEV-20231003)
  * Set Birth Date on Person Demographics tab to use value from selected employee information.
  * BUG FIX: Fixed Appointment Percent display on Employment Position and Salary tabs.
  * BUG FIX: Removed autofocus and autoscroll to the lookup table after entering data in the lookup form.  This caused problems when attempting change previously entered data.  Will revisit this in a future release.
  * MAJOR UPDATE: Converted Request Hierarchy to grouping like the Forms Hierarchy.


## Version 2.0.0 (DEV-20230922)
  * Added popover for group descriptions on Request hiearchy and workflows.
  * Removed text input for Errors Emails in settings; using group selection instead
  * FIXED errors in user.php when calling sendError; needed a third argument
  * Added general email configuration for system-wide errors.
  * FIXED cast return from user in groupusers as array to prevent NULL error in array_merge.
  

## Version 2.0.0 (DEV-20230921)
  * FIXED bug where users who were in HR Forms2, but had no record in SUNY HR were not shown in the Users list and in the available/assigned users in the Groups user list modal.
  * "Missing" users who do not have a SUNY HR record are shown in the assigned users list of the Group modal, but are hidden in the available users list.  This allows for those users to be removed, but not added.
  * Removed the "Save & Exit" button from the review page of Requests when the user cannot edit.  The button was disabled, but still shown and should not have been displayed.
  * FIXED DateFormat error on Form Review tab on the Person Information section.  The DateFomat function was not part of the import list.
  * FIXED reference error to Account field on Employement Salary section on the Form Review page when no account had been selected.
  * Form Hierachy, "Send To User's Department Group?" is now checked by default for new hierarchies.
  * Major Fixes to User data and queries.
    * FIXED User caching logic which was not updating correctly.
    * FIXED user queries (javascript) to use preferred name as part of the fullName and sortName derived fields.
    * Added "Last Refreshed" fields to the user query.
    * Added "Last Refreshed" column to User List
  * Added "Submitter Information" to Requests and Forms.
  * FIXED: Prevent deletion or deactivation of groups when used in a workflow.
    

## Version 2.0.0 (DEV-20230829)
  * Added ability to reset the Application Error message.
  * Changed the display of workflow selection for Request and Form Hierarchy.  A scrollable list that can be filtered is now available.  The selected workflow is displayed using the graphical representation.
  * Added default workflow settings and routing for Requests.
  * Added default workflow settings and routing for Forms.
  * Created config file for settings, similar to the config files for Request and Forms.  Sets default values for elements in the settings page.
  * Disabled Start and End dates in user profile edit screen when editing your own profile; a user should not be able to change their own start/end dates.

## Version 2.0.0 (DEV-20230815)
  * Fixed logic error in new user caching and completed error email notification. 
  * Moved workflow settings to new tab in the Admin Settings page.
  * Added popover to Admin Groups page to display description of the group.
  * Added Markdown rendering support and loaded CHANGELOG.md into the versions page.  The version page will list updates and changes.
  * Completed addition of Gender Identity to person demographics pulling data from SUNY HR.
  * Appointment Percent (on Forms > Position) can now only go as high as what comes from SUNY HR. 

## Version 2.0.0 (DEV-20230811)
  * Added Admin Departments page. Individual departments allow the promary group to be set/changed.
  * Better indication of inactive users and groups in lists.  Inactive items are marked with a strikethrough and the label "(inactive)"
  * SUNY Account information is now populating forms; this was an outstanding item from the original work.  Testing and vaidation are still needed.
  * Major updates to users on the backside.  User information is now stored in the HR Forms tables.  This information is populated from SUNY HR initially.  Other APIs that need user information will use this stored data rather than calling SUNY HR if it exists.  If it doesn't exist then SUNY HR will be queried and the data will be stored.  If the data is "old" (a setting that can be changed in the Admin Settings area) it will attempt to refresh the data.  If there is no SUNY HR data an error email will be sent to me.  The error email is still a work in progress; more to come on that.
  * Changes in progress for archival of Requests and Forms to store the group and hierarchy information rather than pulling the "live" data.  Just like the person information this data should be a snapshot after it is archived as the workflow and groups could change.
  * Addition of CSV exports on several tables (users, groups and departments).  The export will export whatever data is currently available; so if you filter/search the export will match.  This CSV export capability will be expanded to other locations in the future (e.g. the Request and Form lists).
  * Beginning prep for move eventual into production; cleaning up console logging and finishing up "TODO"s in the files.
