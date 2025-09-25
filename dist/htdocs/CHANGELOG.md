# Changelog

## Version 2.0.0(DEV-20250925)
  * Added Title as a search field for Archived Requests.
  * Added back button navigation handling in Requests and Forms archive.
  * Fixed issue with Groups data not being fetched and updated in Settings.
  * Added ability for submitter to delete rejected forms.
  * Added toast notifications for deleting of requests and forms.
  * Fixed invalid variables defined in server code.
  * Fixed email notification errorEmail to use the group instead of the old static variable.
  * Fixed hierarchy.php to check if array element is set.  Errors thrown in PHP 8.
  

## Version 2.0.0(DEV-20250819)
  * Users in groups anywhere in the workflow hierarchy can now view the Form or Request; previously only the submitter and current group could view.
  * Fixed Salary Effective Date to correctly use the entered Effective Date.
  * Fixed Form Review to show correct Salary Effective Date.
  * Fixed missing MAX_JOURNAL_DATE array key in formlist.php for "drafts".
  * Fixed incorrect case for variable in employmentinfo.php that could cause errors; $benefitCodes instead of $benefitecodes.
  * Fixed declaration of subclass variables in session.php.


## Version 2.0.0(DEV-20250725)
  * Added version checking and cache clearing when the version changes.
  * Only display the Form Employment Data Position box on the review tab when the payroll code is 28020 or 28029.
  * Fixed bug in Forms Payroll Transactions where the "PR Required" checkbox would be rechecked.
  * Added search text to URL on some pages; additional pages will be added in future versions.
  * Saved search on Request Hierarchy when switching tabs between Hierarchy and Workflow; Forms Hierarchy to be added in a future version.


## Version 2.0.0(DEV-20250703)
  * Fixed Admin News update that caused it to remove the news text and throw errors.
  * Added show/hide toggle for previous rejected workflows in Requests and Forms journal.
  * Added First Name/Last Name help text for Forms Contacts block.
  * Fixed bug in Forms Contacts blocks that resulted in Last Name not being required when it should be.
  * Changed Requests to be routed based on Org Name selection rather than Submitter's department.


## Version 2.0.0(DEV-20250616)
  * Fixed Forms Employment Position Details not saving.
  * Fixed unexpected Save and Exit when "Enter" key pressed in Forms Employment Position Line Number search.
  * Fixed incorrect logic on Number of Payments and Rate fields on Forms Salary tab that indicated an error when correctly entered.
  * Fixed Form Basic Info field focus problem with Payroll and Effective Date.  Payroll not being focused correctly in all cases.
  * Added missing server code for "Created By" filter in Request Archive List.
  * Added "Multi-Line" column in Request Archive List; was only in search filter.
  * Added Past/Future toggle for both Forms and Request Archive Lists.
  * Fixed Request changed data not being saved on Approval, Reject, and Resubmit.
  * Fixed issue with comments carrying forward and being overwritten in Requests.
  * Changed layout of submitter and user information on Form Review to two columns.


## Version 2.0.0(DEV-20250530)
  * Changed Form Type display on Form Review to include both code and title/description
  * Added User Information section to the Form Review to show the actual user, not just the "effective" user.
  * Change the accordion headers in the Archive List pages to include Forms or Requests as appropriate.
  * Fixed issue with Request rejection throwing an error.
  * Added error handling in Journal PATCH call to indicate if no update was performed.
  * Fixed Archive Search queries not including submitters and approvers.
  * Fixed Salary Rate required field error when field is not displayed.
  * Fixed Line Number search caching issue when entering a line number that had previously been queried.
  * Changed the "Pending" list to show Requests/Forms that are part of approval groups in addition to submitted by.


## Version 2.0.0(DEV-20250515)
  * Changed columns in Requests lists
  * Changed label in Archive search component from "Effective Date" to "Transaction Effective Date".
  * Fixes to tab display and data loading logic in Forms to address infinite loop issue.
  * Change the cursor to a "pointer" for the accordion header on the Archive List pages.
  * Fixed duplicate results being returned for Requests/Forms that have rejections on the Archive List pages. 
  * Fixed duplicate fetch execution on Archive List when search submitted.
  * Added "Enter" key handling to trigger search on Archive list pages.
  * Improvement to Comment History in Requests and Forms:
    * Fixed issue with incorrect groups displaying.
    * Fixed issue with comments carrying forward from previous comments.
    * Added conditional display and striping style for skipped groups.
    * Added popover group description for Forms; this was already in Requests.
    * Added ordering by sequence number to Requests; this was already in Forms.
  * Fixed issues and bugs with approval and final approval code for Requests and Forms.
  * Removed quick approve/reject from lists. Requests and Forms should be reviewed in full.


## Version 2.0.0(DEV-20250428)
  * Fixed issue with HR Final Approvals not showing for members of the HR Group
  * Fixed issue with Archive search not displaying Requests/Forms when user was in the approval hierarchy.
  * Fixed issue with archiving/final approving Requests.
  * Added Degree Specialization to the Form Education block.
  * Fixed issue where skipped workflow badges were not being displayed when they should.
  * Fixed issue with workflow conditional skip not working.
  * Fixed issue where SUNY Account was required for transactions that do not have that field.


## Version 2.0.0(DEV-20250421)
  * Visa only displayed and required when Non-Citizen with Visa type selected.
  * Fixed issue with Journal showing wrong last updated by.
  * Only show Benefit Code 'T' for payroll 28029.
  * Removed maxDate limiter on Archive search for Effective Date; dates can be in the future.
  * Added "Multi Line" search option to Position Request Archive.
  * Fixed error in journal.php with array indexing.
  * Fixed missing code block for Archive forms in form.php code.
  * Added function to remove unicode characters from POST data.


## Version 2.0.0(DEV-20250331)
  * Viewer permission added.  Allows for a view only capability.
  * Fixed user's groups showing up as all "inactive".
  * Fixed error when submitting Requests; error in hierarchy.php code logic.
  * Fixed missing First and Preferred Name in the Form Information (gray box) at the top of the Form.
  * Fixed missing Archived menu item for Forms and Requests.
  * Hide Payment, Rate, and SUNY Account on Forms Salary tab when Transaction is Extra Service, Appoint Summer, or Appoint Winter.
  * Added error notification on Form Basic Info when a transaction has no tabs defined.
  * Fixed error where forms were not submitting after duplicate check.
  * Default Form Salary Effective Date to Form Effective Date.
  * Home email only required for 28020 EF-HIR-* and 28020 EF-PAY-Appoint* forms.
  * Changed layout of Form Review tab for Position and Appointment blocks.


## Version 2.0.0(DEV-20250326)
  * Added "Close" button in Requests and Forms to Drafts.
  * Changed color of Close and Submit buttons.
  * Added duplicate form check and confirmation dialog.
  * Added confirmation dialog for Close button when Form/Request is new or has changes.
  * Fixed error with SUNY Account information on Salary tab in Forms.
  * Error handling for unmatched Departments and Buildings on Forms Directory Review tab.
  * Only display Approvals and Final Approvals when appropriate.
  * Fixed submission issue with Requests; workflow was not being applied correctly.
  * Optimization for Form and Request List data caching.


## Version 2.0.0(DEV-20250303)
  * Fixed missing first name in Final Approval and Rejection lists.
  * Added "Close" button for Requests and Forms.
  * Fixed code in archivelist.php to handle older PHP version on server.
  * Forms: Set Person Demographics Birth Date if Birth Date was used in the lookup on Basic Info.
  * Increased font size on printing review pages.
  * Reformatted groups list in popover in hierarchy.


## Version 2.0.0(DEV-20250217)
  * Fixed bug in Settings with no group data, caused error and prevented page from loading.
  * Fixed popover display issues.
  * Fixed bug with Campus buildings and departments not populating on the Form Person/Directory tab.
  

## Version 2.0.0(DEV-20250212)
  * Updated and improved formatting for small screens and printing on Request and Form Review.
  * Added Archived List and View for Forms.
  * Added Archived List and View for Requests.
  * Bug Fix for Requests Journal using incorrect array for user information.
  * Added Login History page.
  * Set counts and list queries to refetch on window focus when data is stale.
  * Fixes to data fetching and refetching.
  * Fix to positioning of popover on the Users and Groups tables in admin.
  * Removed Unused/Unecessary Groups: Testing, Training, and SUBMITTER.  The SUBMITTER group does not control permissions.
  * Initial build out for "Viewer" functionality.  User management provides ability to set "Viewer", but departments cannot be assigned.


## Version 2.0.0(DEV-20250107)
  * Fixed bug on Forms Volunteer tab that resulted in the Sub-Role field constantly being focused.
  * Fixed bug on Forms Basic Information that caused focus to switch after entering a one number in the Effective Date field.
  * Fixed Forms Basic Information for "PR Required" checkbox being checked by default.
  * Added Template menu item to insert replacement variables into text.
  * Disabled Group deletion for "special" groups (i.e. groups with IDs zero or below).
  * Fixed user data refresh issue for missing/bad cached data.
  * Prevent application from starting if user data is missing/incomplete.
  * Prevent creation of Form/Request when user SUNY ID is missing.
  * Require at least one tab be selected when creating/editing Form Payroll Transactions.
  * Updated several npm packages to latest versions.
  * Fixed bugs with new user creation; groups not displayed, SQL errors post insert.


## Version 2.0.0(DEV-20241216)
  * Required fields in Forms
  * Lock tabs when editing blocks (e.g. directory, education, etc).
  * Added Adjunct radio option on Employment->Appointment tab.  Only Adjunct = 'Yes' displays Faculty Details section.
  * Sort Form Action and Transaction values alphabetically.
  * Updated React Datepicker from 3.8.0 to 7.5.0
  * Updated Icons to be preloaded dynmically from the formats configuration in components.  Added option to prevent pre-loading; {preload:false}
  * Improvements to displaying of Archived menu/home item
  * Added settings and display warnings for "old" Forms and Requests
  * Added background refetching for counts every 30 seconds; disabled after ~10 minutes of inactivity.
  * Updated Archive tables to include Effective Date as a field and partition by the field. 
  * Fixed no data returned for demographics when Role End Date is null.
  * Set default value on all form fields; using form default from configuration.
  * Added Highest Education Level to Form Demographics and related validation.
  * Added Effective Date to Directory Address block in Forms.


## Version 2.0.0(DEV-20241004)
  * Fixed error reporting in Requests to be more responsive.
  * Fixed bug in Forms Payroll Transaction detail when no tabs were selected.  Initialize variable to an empty array.
  * Added non-production alert banner.
  * Fixed the link on the navbar title.  Clicking on HR Forms 2 went to a page not found error.
  * Added newspaper icon to news alert block.
  * Disable "New" menu item when draft count exceeds limit.
  * Fixed timeout handling in Basic Info for PayTrans request.
  * More fixes for user caching.  Fixed issue where cached user information was an empty object, but was not being refreshed.
  * Fixed missing field values in Form Review.


## Version 2.0.0(DEV-20240621)
  * Fixed issue where Benefits were not being populated due to incorrect array reference in server code in employmentinfo.php.
  * Fixed issue where Appointment and Salary tab information was not populating on existing roles.
  * Fixed permission error that caused form lists to not display for some users.


## Version 2.0.0(DEV-20240614)
  * Fixed error in user.php causing incorrect refresh of data and error on update (pushed to dev early).
  * Fixed demographic data not being returned; query was restricted to only return when role end date was in the future.
  * Position data retrieved when any Employment tab is displayed.  Position data is used in the info box and on tabs other than Position.
  * Reworked how counts are handled on home page and menus to be more efficient.
  * Allow menu items to be reordered via drag and drop in settings for Requests and Forms.
  

## Version 2.0.0(DEV-20240609)
  * Fixed Forms Employment Position data not being populated for current roles.
  * Added "markers" for range slider on Position Request Position tab.
  * Fixed incorrect salary calculation on Form Salary tab for BIW, Fee, and HRY appointments.
  * Set Form Position Effective Date and Salary Effective Date to use the Basic Information Effective Date for new role.
  * Fixed error in updateUserInfo in user.php; code was setting user_info to EMPTY_CLOB(), but it needed to be a valid JSON string.  Resulted in segmentation error.
  * Added drag and drop functionality to reorder menu items for Request and Form list menus items in settings.


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
